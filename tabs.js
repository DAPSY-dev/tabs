'use strict';

class Tabs {
  constructor(element, options = {}) {
    this.elements = {
      main: element,
      tabsNav: null,
      buttons: null,
      firstButton: null,
      lastButton: null,
      panels: null,
    };
    this.options = {
      onInit: null,
      onDestroy: null,
      onTabChange: null,
      ...options,
    };
    this.id = this.elements.main.dataset.id;
    this.classNames = {
      init: 'is-init-tabs',
      buttonActive: 'is-active',
      panelHidden: 'is-hidden',
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.init();
  }

  scopeSelector(selector) {
    const elements = [...this.elements.main.querySelectorAll(selector)];
    const filteredElements = elements.filter((element) => (element.closest('.js-tabs') === this.elements.main));
    return filteredElements;
  }

  getPanel(button) {
    return this.elements.main.querySelector(`[data-tab-panel="${button.getAttribute('data-tab-controls')}"]`);
  }

  isInit() {
    return this.elements.main.classList.contains(this.classNames.init);
  }

  init() {
    if (this.isInit()) {
      console.error(`Tabs is already initialized (id): ${this.id}`);
      return;
    }
    this.getElements();
    this.generateA11y();
    this.setInitialTab();
    this.addEvents();
    this.elements.main.classList.add(this.classNames.init);
    if (typeof this.options.onInit === 'function') {
      this.options.onInit(this);
    }
  }

  getElements() {
    this.elements.tabsNav = this.scopeSelector('.js-tabs-nav')[0];
    this.elements.buttons = this.scopeSelector('.js-tabs-button');
    this.elements.panels = [];
    for (const button of this.elements.buttons) {
      const panel = this.getPanel(button);
      this.connectTab(button, panel);
      this.elements.panels.push(panel);
      if (!this.elements.firstButton) {
        this.elements.firstButton = button;
      }
      this.elements.lastButton = button;
    }
  }

  connectTab(button, panel) {
    const buttonId = button.getAttribute('data-tab-controls');
    const panelId = `panel-${buttonId}`;
    if (
      button.hasAttribute('id') ||
      button.hasAttribute('aria-controls') ||
      panel.hasAttribute('id') ||
      panel.hasAttribute('aria-labelledby')
    ) {
      return;
    }
    button.setAttribute('id', buttonId);
    button.setAttribute('aria-controls', panelId);
    panel.setAttribute('id', panelId);
    panel.setAttribute('aria-labelledby', buttonId);
  }

  generateA11y() {
    this.elements.tabsNav.setAttribute('role', 'tablist');
    for (const button of this.elements.buttons) {
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('tabindex', '-1');
    }
    for (const panel of this.elements.panels) {
      panel.setAttribute('role', 'tabpanel');
    }
  }

  removeA11y() {
    this.elements.tabsNav.removeAttribute('role');
    for (const button of this.elements.buttons) {
      button.removeAttribute('role');
      button.removeAttribute('aria-selected');
      button.removeAttribute('tabindex');
    }
    for (const panel of this.elements.panels) {
      panel.removeAttribute('role');
    }
  }

  addEvents() {
    for (const button of this.elements.buttons) {
      button.addEventListener('click', this.handleClick.bind(this));
      button.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  removeEvents() {
    for (const button of this.elements.buttons) {
      button.removeEventListener('click', this.handleClick.bind(this));
      button.removeEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  setInitialTab() {
    const activeButton = this.scopeSelector(`.js-tabs-button.${this.classNames.buttonActive}`)[0];
    this.setSelectedTab((activeButton) ? activeButton : this.elements.firstButton);
  }

  setSelectedTab(buttonElement) {
    for (const [i, button] of this.elements.buttons.entries()) {
      const panel = this.getPanel(button);
      if (buttonElement === button) {
        button.setAttribute('aria-selected', 'true');
        button.removeAttribute('tabindex');
        button.classList.add(this.classNames.buttonActive);
        panel.classList.remove(this.classNames.panelHidden);
      } else {
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('tabindex', '-1');
        button.classList.remove(this.classNames.buttonActive);
        panel.classList.add(this.classNames.panelHidden);
      }
    }
    if (typeof this.options.onTabChange === 'function') {
      this.options.onTabChange(this);
    }
  }

  moveFocusToTab(button) {
    button.focus();
  }

  moveFocusToPreviousTab(button) {
    let index = null;
    if (button === this.elements.firstButton) {
      this.moveFocusToTab(this.elements.lastButton);
    } else {
      index = this.elements.buttons.indexOf(button);
      this.moveFocusToTab(this.elements.buttons[index - 1]);
    }
  }

  moveFocusToNextTab(button) {
    let index = null;
    if (button === this.elements.lastButton) {
      this.moveFocusToTab(this.elements.firstButton);
    } else {
      index = this.elements.buttons.indexOf(button);
      this.moveFocusToTab(this.elements.buttons[index + 1]);
    }
  }

  handleClick(e) {
    this.setSelectedTab(e.currentTarget);
  }

  handleKeydown(e) {
    const target = e.currentTarget;
    let stopEventActions = false;
    switch (e.key) {
      case 'ArrowLeft':
        stopEventActions = true;
        this.moveFocusToPreviousTab(target);
        break;
      case 'ArrowRight':
        stopEventActions = true;
        this.moveFocusToNextTab(target);
        break;
      case 'Home':
        stopEventActions = true;
        this.moveFocusToTab(this.elements.firstButton);
        break;
      case 'End':
        stopEventActions = true;
        this.moveFocusToTab(this.elements.lastButton);
        break;
      default:
        break;
    }
    if (stopEventActions) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  destroy() {
    if (!this.isInit()) {
      console.error(`Tabs is not initialized (id): ${this.id}`);
      return;
    }
    if (typeof this.options.onDestroy === 'function') {
      this.options.onDestroy(this);
    }
    this.removeEvents();
    this.removeA11y();
    this.elements.tabsNav = null;
    this.elements.buttons = null;
    this.elements.firstButton = null;
    this.elements.lastButton = null;
    this.elements.panels = null;
    this.elements.main.classList.remove(this.classNames.init);
  }
}
