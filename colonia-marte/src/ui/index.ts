import "./foundation/tokens.css";
import "./atoms/atoms-actions.css";
import "./atoms/atoms-forms.css";
import "./molecules/molecules.css";
import "./organisms/organisms.css";
import "./atoms/hud-atoms.css";
import "./molecules/hud-molecules.css";
import "./organisms/game-hud.css";
import "./organisms/pause-menu.css";
import "./organisms/crew-dialogue.css";
import "./molecules/hud-stepper.css";
import "./molecules/hud-choice.css";
import "./molecules/hud-hold-gate.css";
import "./organisms/settings-menu.css";
import "./organisms/phase1.css";
import "./organisms/loading.css";

import { registerAvatarAtoms } from "./atoms/avatar";
import { registerButtonAtom } from "./atoms/button";
import { registerInputAtoms } from "./atoms/inputs";
import { registerSelectionAtoms } from "./atoms/selection";
import { registerSliderAtom } from "./atoms/slider";
import { registerStatusAtoms } from "./atoms/status";
import { registerFoundationComponents } from "./foundation/tokens";
import { registerContentSwitcherMolecule } from "./molecules/content-switcher";
import { registerNavigationMolecules } from "./molecules/navigation-molecules";
import { registerSearchBarMolecule } from "./molecules/search-bar";
import { registerNavbarOrganism } from "./organisms/navbar";
import { registerToastOrganism } from "./organisms/toast";
import { registerHudAtoms } from "./atoms/hud-atoms";
import { registerHudMolecules } from "./molecules/hud-molecules";
import { registerGameHudOrganism } from "./organisms/game-hud";
import { registerPauseMenuOrganism } from "./organisms/pause-menu";
import { registerCrewDialogue } from "./organisms/crew-dialogue";
import { registerHudStepper } from "./molecules/hud-stepper";
import { registerHudChoice } from "./molecules/hud-choice";
import { registerHudHoldGate } from "./molecules/hud-hold-gate";
import { registerSettingsMenu } from "./organisms/settings-menu";
import { registerChapterCard } from "./organisms/chapter-card";
import { registerLoading } from "./organisms/loading";
import { registerMainMenu } from "./organisms/main-menu";
import { UIRegistry } from "./registry";

export function createUIRegistry(): UIRegistry {
  const registry = new UIRegistry();
  registerFoundationComponents(registry);
  registerButtonAtom(registry);
  registerAvatarAtoms(registry);
  registerStatusAtoms(registry);
  registerSelectionAtoms(registry);
  registerInputAtoms(registry);
  registerSliderAtom(registry);
  registerSearchBarMolecule(registry);
  registerContentSwitcherMolecule(registry);
  registerNavigationMolecules(registry);
  registerNavbarOrganism(registry);
  registerToastOrganism(registry);
  registerHudAtoms(registry);
  registerHudMolecules(registry);
  registerGameHudOrganism(registry);
  registerPauseMenuOrganism(registry);
  registerCrewDialogue(registry);
  registerHudStepper(registry);
  registerHudChoice(registry);
  registerHudHoldGate(registry);
  registerSettingsMenu(registry);
  registerChapterCard(registry);
  registerLoading(registry);
  registerMainMenu(registry);
  return registry;
}

export { UIRegistry } from "./registry";
export type { RegisteredUIComponent, UIComponentDefinition, UIComponentMetadata, UILayer } from "./types";
export { createIcon, UI_ICON_NAMES, type UIIconInput, type UIIconName } from "./foundation/icons";
export { uiColors, uiSpacing, uiTypography } from "./foundation/tokens";
export { announcePolite, bindFieldValidation, ensureValidationAnnouncer } from "./foundation/validation";
export { createButton, type UIButtonParams } from "./atoms/button";
export { createAvatar, createAvatarGroup, type UIAvatarGroupParams, type UIAvatarParams } from "./atoms/avatar";
export {
  createLink,
  createLoader,
  createTag,
  type UILinkParams,
  type UILoaderParams,
  type UITagParams,
  type UITagType,
} from "./atoms/status";
export {
  createCheckbox,
  createRadioGroup,
  createToggle,
  type UICheckboxParams,
  type UIRadioGroupParams,
  type UIToggleParams,
} from "./atoms/selection";
export {
  createDropdown,
  createTextField,
  type UIDropdownParams,
  type UITextFieldParams,
} from "./atoms/inputs";
export { createSlider, type UISliderParams } from "./atoms/slider";
export { createSearchBar, type UISearchBarParams } from "./molecules/search-bar";
export { createContentSwitcher, type UIContentSwitcherParams } from "./molecules/content-switcher";
export {
  createBreadcrumbs,
  createPagination,
  type UIBreadcrumbsParams,
  type UIPaginationParams,
} from "./molecules/navigation-molecules";
export { createNavbar, DEFAULT_APP_NAV_ITEMS, type UINavbarParams, type UINavItem } from "./organisms/navbar";
export {
  createToastElement,
  ensureToastRegion,
  showToast,
  TOAST_TYPES,
  type UIToastParams,
  type UIToastType,
} from "./organisms/toast";
export * from "./atoms/hud-atoms";
export * from "./molecules/hud-molecules";
export { createGameHud, CANTEEN_HUD_STATE, type GameHudState } from "./organisms/game-hud";
export { createPauseMenu, DEFAULT_PAUSE_STATE, type PauseMenuItem, type PauseMenuState } from "./organisms/pause-menu";
export { createCrewDialogue, createHudReply, TESS_DISPENSER_DIALOGUE, type CrewDialogueState, type CrewSpeaker } from "./organisms/crew-dialogue";
export * from "./molecules/hud-stepper";
export * from "./molecules/hud-choice";
export * from "./molecules/hud-hold-gate";
export * from "./organisms/settings-menu";
export * from "./state/settings";
export * from "./organisms/chapter-card";
export * from "./organisms/loading";
export * from "./organisms/main-menu";
