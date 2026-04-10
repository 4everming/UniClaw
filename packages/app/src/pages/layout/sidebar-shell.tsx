import { createEffect, createMemo, For, Show, type Accessor, type JSX } from "solid-js"
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  type DragEvent,
} from "@thisbeyond/solid-dnd"
import { ConstrainDragXAxis } from "@/utils/solid-dnd"
import { Icon } from "@opencode-ai/ui/icon"
import { Tooltip, TooltipKeybind } from "@opencode-ai/ui/tooltip"
import { type LocalProject } from "@/context/layout"

export const SidebarContent = (props: {
  mobile?: boolean
  opened: Accessor<boolean>
  aimMove: (event: MouseEvent) => void
  projects: Accessor<LocalProject[]>
  renderProject: (project: LocalProject) => JSX.Element
  handleDragStart: (event: unknown) => void
  handleDragEnd: () => void
  handleDragOver: (event: DragEvent) => void
  openProjectLabel: JSX.Element
  openProjectKeybind: Accessor<string | undefined>
  onOpenProject: () => void
  renderProjectOverlay: () => JSX.Element
  skillsLabel: Accessor<string>
  skillsKeybind: Accessor<string | undefined>
  onOpenSkills: () => void
  settingsLabel: Accessor<string>
  settingsKeybind: Accessor<string | undefined>
  onOpenSettings: () => void
  helpLabel: Accessor<string>
  onOpenHelp: () => void
  renderPanel: () => JSX.Element
  newSessionLabel?: Accessor<string>
  newSessionKeybind?: Accessor<string | undefined>
  onNewSession?: () => void
  searchLabel?: Accessor<string>
  searchKeybind?: Accessor<string | undefined>
  onSearch?: () => void
  automationLabel?: Accessor<string>
  threadsLabel?: Accessor<string>
  newThreadKeybind?: Accessor<string | undefined>
  onNewThread?: () => void
}): JSX.Element => {
  const expanded = createMemo(() => !!props.mobile || props.opened())

  return (
    <div class="flex h-full w-full min-w-0 overflow-hidden">
      <div
        classList={{
          "flex flex-col h-full w-full min-w-0 bg-background-base": true,
        }}
      >
        {/* Top action buttons */}
        <div class="shrink-0 flex flex-col gap-0.5 px-3 pt-3 pb-1">
          <Show when={props.onNewSession}>
            <button
              type="button"
              class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md text-left text-14-regular text-text-base hover:bg-surface-raised-base-hover transition-colors"
              onClick={() => props.onNewSession?.()}
            >
              <div class="shrink-0 size-5 flex items-center justify-center">
                <Icon name="new-session" size="small" class="text-icon-base" />
              </div>
              <span class="truncate">{props.newSessionLabel?.() ?? "New thread"}</span>
            </button>
          </Show>
          <Show when={props.onSearch}>
            <button
              type="button"
              class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md text-left text-14-regular text-text-base hover:bg-surface-raised-base-hover transition-colors"
              onClick={() => props.onSearch?.()}
            >
              <div class="shrink-0 size-5 flex items-center justify-center">
                <Icon name="magnifying-glass" size="small" class="text-icon-base" />
              </div>
              <span class="truncate">{props.searchLabel?.() ?? "Search"}</span>
            </button>
          </Show>
          <button
            type="button"
            class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md text-left text-14-regular text-text-base hover:bg-surface-raised-base-hover transition-colors"
            onClick={props.onOpenSkills}
          >
            <div class="shrink-0 size-5 flex items-center justify-center">
              <Icon name="brain" size="small" class="text-icon-base" />
            </div>
            <span class="truncate">{props.skillsLabel()}</span>
          </button>
          <Show when={props.automationLabel}>
            <button
              type="button"
              class="flex items-center gap-3 w-full px-2 py-1.5 rounded-md text-left text-14-regular text-text-base hover:bg-surface-raised-base-hover transition-colors cursor-default opacity-50"
              disabled
            >
              <div class="shrink-0 size-5 flex items-center justify-center">
                <Icon name="console" size="small" class="text-icon-base" />
              </div>
              <span class="truncate">{props.automationLabel?.()}</span>
            </button>
          </Show>
        </div>

        {/* Threads section header */}
        <div class="shrink-0 flex items-center justify-between px-5 pt-4 pb-1">
          <span class="text-12-medium text-text-weak uppercase tracking-wider">{props.threadsLabel?.() ?? "Threads"}</span>
          <div class="flex items-center gap-1">
            <Show when={props.openProjectKeybind}>
              <TooltipKeybind
                placement={props.mobile ? "bottom" : "bottom"}
                title={props.openProjectLabel as string}
                keybind={props.openProjectKeybind?.() ?? ""}
              >
                <button
                  type="button"
                  class="shrink-0 size-6 flex items-center justify-center rounded-md text-icon-base hover:bg-surface-raised-base-hover transition-colors"
                  onClick={props.onOpenProject}
                >
                  <Icon name="folder-add-left" size="small" />
                </button>
              </TooltipKeybind>
            </Show>
          </div>
        </div>

        {/* Projects list (collapsible groups) with sessions */}
        <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar px-2">
          <DragDropProvider
            onDragStart={props.handleDragStart}
            onDragEnd={props.handleDragEnd}
            onDragOver={props.handleDragOver}
            collisionDetector={closestCenter}
          >
            <DragDropSensors />
            <ConstrainDragXAxis />
            <div class="flex flex-col">
              <SortableProvider ids={props.projects().map((p) => p.worktree)}>
                <For each={props.projects()}>{(project) => props.renderProject(project)}</For>
              </SortableProvider>
            </div>
            <DragOverlay>{props.renderProjectOverlay()}</DragOverlay>
          </DragDropProvider>
        </div>

        {/* Bottom section: settings + help */}
        <div class="shrink-0 px-3 pb-4 pt-2 flex items-center justify-between border-t border-border-weaker-base">
          <button
            type="button"
            class="flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-14-regular text-text-base hover:bg-surface-raised-base-hover transition-colors"
            onClick={props.onOpenSettings}
          >
            <Icon name="settings-gear" size="small" class="text-icon-base" />
            <span>{props.settingsLabel()}</span>
          </button>
          <Tooltip placement="top" value={props.helpLabel()}>
            <button
              type="button"
              class="shrink-0 size-8 flex items-center justify-center rounded-md text-icon-base hover:bg-surface-raised-base-hover transition-colors"
              onClick={props.onOpenHelp}
            >
              <Icon name="help" size="small" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
