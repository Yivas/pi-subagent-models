import {
  DynamicBorder,
  keyHint,
  rawKeyHint,
  type ExtensionCommandContext,
  type Theme,
} from "@earendil-works/pi-coding-agent"
import {
  Container,
  fuzzyFilter,
  Input,
  type KeybindingsManager,
  Spacer,
  Text,
  type TUI,
} from "@earendil-works/pi-tui"

const MAX_VISIBLE = 10

export class SearchableSelector extends Container {
  private readonly tui: TUI
  private readonly theme: Theme
  private readonly keybindings: KeybindingsManager
  private readonly options: string[]
  private readonly done: (result: string | undefined) => void
  private readonly searchInput: Input
  private readonly listContainer: Container
  private filteredOptions: string[]
  private selectedIndex = 0

  constructor(
    tui: TUI,
    theme: Theme,
    keybindings: KeybindingsManager,
    options: string[],
    title: string,
    done: (result: string | undefined) => void,
  ) {
    super()
    this.tui = tui
    this.theme = theme
    this.keybindings = keybindings
    this.options = options
    this.done = done
    this.filteredOptions = options

    const border = () => new DynamicBorder((text) => theme.fg("border", text))
    this.addChild(border())
    this.addChild(new Spacer(1))
    this.addChild(new Text(theme.fg("accent", theme.bold(title)), 0, 0))
    this.addChild(new Spacer(1))

    this.searchInput = new Input()
    this.searchInput.focused = true
    this.searchInput.onSubmit = () => this.confirmSelection()
    this.addChild(this.searchInput)
    this.addChild(new Spacer(1))

    this.listContainer = new Container()
    this.addChild(this.listContainer)
    this.addChild(new Spacer(1))
    this.addChild(new Text(
      `${rawKeyHint("↑↓", "navigate")}  ${keyHint("tui.select.confirm", "select")}  ${keyHint("tui.select.cancel", "cancel")}`,
      0,
      0,
    ))
    this.addChild(new Spacer(1))
    this.addChild(border())
    this.updateList()
  }

  private applyFilter(query: string): void {
    this.filteredOptions = query
      ? fuzzyFilter(this.options, query, (option) => option)
      : this.options
    this.selectedIndex = 0
    this.updateList()
  }

  private updateList(): void {
    this.listContainer.clear()
    const startIndex = Math.max(
      0,
      Math.min(
        this.selectedIndex - Math.floor(MAX_VISIBLE / 2),
        this.filteredOptions.length - MAX_VISIBLE,
      ),
    )
    const endIndex = Math.min(startIndex + MAX_VISIBLE, this.filteredOptions.length)

    for (let index = startIndex; index < endIndex; index++) {
      const option = this.filteredOptions[index]!
      const line = index === this.selectedIndex
        ? this.theme.fg("accent", `→ ${option}`)
        : `  ${option}`
      this.listContainer.addChild(new Text(line, 0, 0))
    }

    if (startIndex > 0 || endIndex < this.filteredOptions.length) {
      this.listContainer.addChild(new Text(
        this.theme.fg("muted", `  (${this.selectedIndex + 1}/${this.filteredOptions.length})`),
        0,
        0,
      ))
    }
    if (this.filteredOptions.length === 0) {
      this.listContainer.addChild(new Text(this.theme.fg("muted", "  No matching entries"), 0, 0))
    }
  }

  private confirmSelection(): void {
    const selected = this.filteredOptions[this.selectedIndex]
    if (selected) this.done(selected)
  }

  handleInput(keyData: string): void {
    if (this.keybindings.matches(keyData, "tui.select.up")) {
      if (this.filteredOptions.length === 0) return
      this.selectedIndex = this.selectedIndex === 0
        ? this.filteredOptions.length - 1
        : this.selectedIndex - 1
      this.updateList()
    } else if (this.keybindings.matches(keyData, "tui.select.down")) {
      if (this.filteredOptions.length === 0) return
      this.selectedIndex = this.selectedIndex === this.filteredOptions.length - 1
        ? 0
        : this.selectedIndex + 1
      this.updateList()
    } else if (this.keybindings.matches(keyData, "tui.select.confirm")) {
      this.confirmSelection()
    } else if (this.keybindings.matches(keyData, "tui.select.cancel")) {
      this.done(undefined)
    } else {
      this.searchInput.handleInput(keyData)
      this.applyFilter(this.searchInput.getValue())
    }
    this.tui.requestRender()
  }
}

export function selectOption(
  ctx: ExtensionCommandContext,
  title: string,
  options: string[],
): Promise<string | undefined> {
  return ctx.ui.custom((tui, theme, keybindings, done) =>
    new SearchableSelector(tui, theme, keybindings, options, title, done),
  )
}
