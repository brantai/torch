const BUTTON_HTML = `<div class="control-icon torch"><i class="fas fa-fire"></i></div>`;
const DISABLED_ICON_HTML = `<i class="fas fa-slash" style="position: absolute; color: tomato"></i>`;
const SOURCE_MENU = `<div class="control-icon light-source-menu" style="padding: 4px 2px"></div>`;
const SOURCE_MENU_ITEM = (img, tooltip) => {
  return `<button type="button" class="light-source-menu-item" style="border: 1px solid var(--color-border-light-primary); padding:0" >
	  <img src="${img}" title="${tooltip}" style="margin:0"/>
	</button>`;
};
//style="padding: 4px 2px"
//style="border: 1px solid var(--color-border-light-primary); padding:0"
//style="margin:0"

export default class TokenHUD {
  /*
   * Add a torch button to the Token HUD - called from TokenHUD render hook
   */
  static async addFlameButton(
    token,
    hudHtml,
    forceLightSourceOff,
    toggleLightSource,
    togglelightHeld,
    changeLightSource
  ) {
    let state = token.lightSourceState;
    let disabled = token.currentLightSourceIsExhausted;
    let allowEvent = !disabled;
    let tbutton = $(BUTTON_HTML);
    if (state === token.STATE_ON) {
      tbutton.addClass("active");
    } else if (state === token.STATE_DIM) {
      tbutton.addClass("active");
    } else if (disabled) {
      let disabledIcon = $(DISABLED_ICON_HTML);
      tbutton.addClass("fa-stack");
      tbutton.find("i").addClass("fa-stack-1x");
      disabledIcon.addClass("fa-stack-1x");
      tbutton.append(disabledIcon);
    }
    hudHtml.find(".col.left").prepend(tbutton);
    tbutton.find("i").contextmenu(async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (token.lightSourceState === token.STATE_OFF) {
        TokenHUD.toggleSourceMenu(tbutton, token, changeLightSource);
      }
    });
    if (allowEvent) {
      tbutton.find("i").click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!tbutton.next().hasClass("light-source-menu")) {
          if (event.shiftKey) {
            togglelightHeld(token);
          } else if (event.altKey) {
            await forceLightSourceOff(token);
            TokenHUD.syncFlameButtonState(tbutton, token);
          } else {
            await toggleLightSource(token);
            TokenHUD.syncFlameButtonState(tbutton, token);
          }
        }
      });
    }
  }

  static toggleSourceMenu(button, token, changeLightSource) {
    // If we already have a menu, toggle it away
    let maybeOldMenu = button.next();
    if (maybeOldMenu.hasClass("light-source-menu")) {
      maybeOldMenu.remove();
      return;
    }
    // If we don't have a menu, show it
    let menu = $(SOURCE_MENU);
    let sources = token.ownedLightSources;
    let currentSource = token.currentLightSource;
    for (let source of sources) {
      let child = $(SOURCE_MENU_ITEM(source.image, source.name));
      if (source.name === currentSource) {
        child.css("border-color", "tomato");
      }
	  if (token.sourceIsExhausted(source.name)) {
		child.css("opacity", "0.3");
	  }
      child.click(async (ev) => {
        let menu = $(ev.currentTarget.parentElement);
        await changeLightSource(token, source.name);
        TokenHUD.syncDisabledState(button, token);
        menu.remove();
      });
      menu.append(child);
    }
    button.after(menu);
  }

  static syncDisabledState(tbutton, token) {
    let oldSlash = tbutton.find(".fa-slash");
    let wasDisabled = oldSlash.length > 0;
    let willBeDisabled = token.currentLightSourceIsExhausted;
    if (!wasDisabled && willBeDisabled) {
      let disabledIcon = $(DISABLED_ICON_HTML);
      tbutton.addClass("fa-stack");
      tbutton.find("i").addClass("fa-stack-1x");
      disabledIcon.addClass("fa-stack-1x");
      tbutton.append(disabledIcon);
    } else if (wasDisabled && !willBeDisabled) {
      oldSlash.remove();
      tbutton.find("i").removeClass("fa-stack-1x");
      tbutton.removeClass("fa-stack");
    }
  }

  static syncFlameButtonState(tButton, token) {
    let state = token.lightSourceState;
    if (state === token.STATE_ON) {
      tButton.addClass("active");
    } else if (state === token.STATE_DIM) {
      tButton.addClass("active");
    } else {
      tButton.removeClass("active");
    }
  }
}
