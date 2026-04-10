import { createMemo, For, Show, type Accessor, type JSX } from "solid-js"
import { createStore } from "solid-js/store"
import { base64Encode } from "@opencode-ai/util/encode"
import { useNavigate, useParams } from "@solidjs/router"
import { ContextMenu } from "@opencode-ai/ui/context-menu"
import { Collapsible } from "@opencode-ai/ui/collapsible"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { createSortable } from "@thisbeyond/solid-dnd"
import { useLayout, type LocalProject } from "@/context/layout"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import { useNotification } from "@/context/notification"
import { ProjectIcon, SessionItem, type SessionItemProps, SessionSkeleton } from "./sidebar-items"
import { displayName, sortedRootSessions, workspaceKey } from "./helpers"

export type ProjectSidebarContext = {
  currentDir: Accessor<string>
  currentProject: Accessor<LocalProject | undefined>
  sidebarOpened: Accessor<boolean>
  sidebarHovering: Accessor<boolean>
  hoverProject: Accessor<string | undefined>
  onProjectMouseEnter: (worktree: string, event: MouseEvent) => void
  onProjectMouseLeave: (worktree: string) => void
  onProjectFocus: (worktree: string) => void
  onHoverOpenChanged: (worktree: string, hovered: boolean) => void
  navigateToProject: (directory: string) => void
  openSidebar: () => void
  closeProject: (directory: string) => void
  showEditProjectDialog: (project: LocalProject) => void
  toggleProjectWorkspaces: (project: LocalProject) => void
  workspacesEnabled: (project: LocalProject) => boolean
  workspaceIds: (project: LocalProject) => string[]
  workspaceLabel: (directory: string, branch?: string, projectId?: string) => string
  sessionProps: Omit<SessionItemProps, "session" | "list" | "slug" | "mobile" | "dense">
}

export const ProjectDragOverlay = (props: {
  projects: Accessor<LocalProject[]>
  activeProject: Accessor<string | undefined>
}): JSX.Element => {
  const project = createMemo(() => props.projects().find((p) => p.worktree === props.activeProject()))
  return (
    <Show when={project()}>
      {(p) => (
        <div class="bg-background-base rounded-lg px-3 py-2 flex items-center gap-2 shadow-md">
          <ProjectIcon project={p()} class="size-5" />
          <span class="text-14-medium text-text-strong truncate">{displayName(p())}</span>
        </div>
      )}
    </Show>
  )
}

export const SortableProject = (props: {
  project: LocalProject
  mobile?: boolean
  ctx: ProjectSidebarContext
  sortNow: Accessor<number>
}): JSX.Element => {
  const globalSync = useGlobalSync()
  const language = useLanguage()
  const notification = useNotification()
  const layout = useLayout()
  const sortable = createSortable(props.project.worktree)
  const selected = createMemo(() => props.ctx.currentProject()?.worktree === props.project.worktree)
  const dirs = createMemo(() => props.ctx.workspaceIds(props.project))
  const [state, setState] = createStore({
    menu: false,
  })

  const navigate = useNavigate()
  const params = useParams()
  const slug = createMemo(() => base64Encode(props.project.worktree))

  const unseenCount = createMemo(() =>
    dirs().reduce((total, directory) => total + notification.project.unseenCount(directory), 0),
  )

  const clear = () =>
    dirs()
      .filter((directory) => notification.project.unseenCount(directory) > 0)
      .forEach((directory) => notification.project.markViewed(directory))

  const projectStore = createMemo(() => globalSync.child(props.project.worktree, { bootstrap: false })[0])
  const sessions = createMemo(() => sortedRootSessions(projectStore(), props.sortNow()))
  const booted = createMemo((prev) => prev || projectStore().status === "complete", false)
  const count = createMemo(() => sessions()?.length ?? 0)
  const loading = createMemo(() => selected() && !booted() && count() === 0)

  return (
    // @ts-ignore
    <div use:sortable classList={{ "opacity-30": sortable.isActiveDraggable }}>
      <ContextMenu
        modal={!props.ctx.sidebarHovering()}
        onOpenChange={(value) => setState("menu", value)}
      >
        <ContextMenu.Trigger as="div">
          <Collapsible
            variant="ghost"
            open={selected()}
            class="shrink-0"
            onOpenChange={() => {
              if (!selected()) {
                props.ctx.navigateToProject(props.project.worktree)
              }
            }}
          >
            <Collapsible.Trigger
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left hover:bg-surface-raised-base-hover transition-colors cursor-default group/project"
              data-action="project-switch"
              data-project={slug()}
            >
              <div class="shrink-0 size-5 flex items-center justify-center">
                <Icon
                  name={selected() ? "chevron-down" : "chevron-right"}
                  size="small"
                  class="text-icon-weak"
                />
              </div>
              <ProjectIcon project={props.project} notify class="size-5" />
              <span
                classList={{
                  "text-14-medium truncate flex-1 min-w-0": true,
                  "text-text-strong": selected(),
                  "text-text-base": !selected(),
                }}
              >
                {displayName(props.project)}
              </span>
              <Show when={unseenCount() > 0}>
                <div class="shrink-0 size-1.5 rounded-full bg-text-interactive-base" />
              </Show>
              <div
                class="shrink-0 transition-opacity"
                classList={{
                  "opacity-100": state.menu,
                  "opacity-0 group-hover/project:opacity-100 group-focus-within/project:opacity-100": !state.menu,
                }}
              >
                <IconButton
                  icon="new-session"
                  variant="ghost"
                  class="size-6 rounded-md"
                  aria-label={language.t("command.session.new")}
                  onClick={(event: MouseEvent) => {
                    event.preventDefault()
                    event.stopPropagation()
                    navigate(`/${base64Encode(props.project.worktree)}/session`)
                    layout.mobileSidebar.hide()
                  }}
                />
              </div>
            </Collapsible.Trigger>

            <Collapsible.Content>
              <div class="pl-4 flex flex-col">
                <Show when={loading()}>
                  <div class="pl-3 py-1">
                    <SessionSkeleton count={3} />
                  </div>
                </Show>
                <For each={sessions()}>
                  {(session) => (
                    <SessionItem
                      {...props.ctx.sessionProps}
                      session={session}
                      list={sessions()}
                      slug={slug()}
                      mobile={props.mobile}
                      showChild
                      level={1}
                      sidebarExpanded={props.ctx.sidebarOpened}
                      clearHoverProjectSoon={props.ctx.sessionProps.clearHoverProjectSoon}
                      prefetchSession={props.ctx.sessionProps.prefetchSession}
                      archiveSession={props.ctx.sessionProps.archiveSession}
                    />
                  )}
                </For>
              </div>
            </Collapsible.Content>
          </Collapsible>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content>
            <ContextMenu.Item onSelect={() => props.ctx.showEditProjectDialog(props.project)}>
              <ContextMenu.ItemLabel>{language.t("common.edit")}</ContextMenu.ItemLabel>
            </ContextMenu.Item>
            <ContextMenu.Item
              data-action="project-workspaces-toggle"
              data-project={slug()}
              disabled={props.project.vcs !== "git" && !props.ctx.workspacesEnabled(props.project)}
              onSelect={() => props.ctx.toggleProjectWorkspaces(props.project)}
            >
              <ContextMenu.ItemLabel>
                {props.ctx.workspacesEnabled(props.project)
                  ? language.t("sidebar.workspaces.disable")
                  : language.t("sidebar.workspaces.enable")}
              </ContextMenu.ItemLabel>
            </ContextMenu.Item>
            <ContextMenu.Item
              data-action="project-clear-notifications"
              data-project={slug()}
              disabled={unseenCount() === 0}
              onSelect={clear}
            >
              <ContextMenu.ItemLabel>{language.t("sidebar.project.clearNotifications")}</ContextMenu.ItemLabel>
            </ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item
              data-action="project-close-menu"
              data-project={slug()}
              onSelect={() => props.ctx.closeProject(props.project.worktree)}
            >
              <ContextMenu.ItemLabel>{language.t("common.close")}</ContextMenu.ItemLabel>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu>
    </div>
  )
}
