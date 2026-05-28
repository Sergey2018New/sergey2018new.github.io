/**
 * @typedef {Object} dNode
 * @property {HTMLElement} parent
 * @property {HTMLElement} element
 * @property {HTMLElement} to
 * @property {string} breakpoint
 * @property {string} order
 * @property {number} index
 */

/**
 * @typedef {Object} dMediaQuery
 * @property {string} query
 * @property {number} breakpoint
 */

/**
 * @param {'min' | 'max'} type
 */
function useDynamicAdapt(type = 'max') {
  const className = '_dynamic_adapt_';
  const attrName = 'data-da';

  /** @type {dNode[]} */
  const dNodes = getDNodes();

  /** @type {dMediaQuery[]} */
  const dMediaQueries = getDMediaQueries(dNodes);

  dMediaQueries.forEach((dMediaQuery) => {
    const matchMedia = window.matchMedia(dMediaQuery.query);
    // массив объектов с подходящим брейкпоинтом
    const filteredDNodes = dNodes.filter(({ breakpoint }) => breakpoint === dMediaQuery.breakpoint);
    const mediaHandler = getMediaHandler(matchMedia, filteredDNodes);
    matchMedia.addEventListener('change', mediaHandler);

    mediaHandler();
  });

  function getDNodes() {
    const result = [];
    const elements = [...document.querySelectorAll(`[${attrName}]`)];

    elements.forEach((element) => {
      const attr = element.getAttribute(attrName);
      const [toSelector, breakpoint, order] = attr.split(',').map((val) => val.trim());

      const to = document.querySelector(toSelector);

      if (to) {
        result.push({
          parent: element.parentElement,
          element,
          to,
          breakpoint: breakpoint ?? '767',
          order: order !== undefined ? (isNumber(order) ? Number(order) : order) : 'last',
          index: -1,
        });
      }
    });

    return sortDNodes(result)
  }

  /**
   * @param {dNode} items
   * @returns {dMediaQuery[]}
   */
  function getDMediaQueries(items) {
    const uniqItems = [...new Set(items.map(({ breakpoint }) => `(${type}-width: ${breakpoint}px),${breakpoint}`))];

    return uniqItems.map((item) => {
      const [query, breakpoint] = item.split(',');

      return { query, breakpoint }
    })
  }

  /**
   * @param {MediaQueryList} matchMedia
   * @param {dNodes} items
   */
  function getMediaHandler(matchMedia, items) {
    return function mediaHandler() {
      if (matchMedia.matches) {
        items.forEach((item) => {
          moveTo(item);
        });

        items.reverse();
      } else {
        items.forEach((item) => {
          if (item.element.classList.contains(className)) {
            moveBack(item);
          }
        });

        items.reverse();
      }
    }
  }

  /**
   * @param {dNode} dNode
   */
  function moveTo(dNode) {
    const { to, element, order } = dNode;
    dNode.index = getIndexInParent(dNode.element, dNode.element.parentElement);
    element.classList.add(className);

    if (order === 'last' || order >= to.children.length) {
      to.append(element);

      return
    }

    if (order === 'first') {
      to.prepend(element);

      return
    }

    to.children[order].before(element);
  }

  /**
   * @param {dNode} dNode
   */
  function moveBack(dNode) {
    const { parent, element, index } = dNode;
    element.classList.remove(className);

    if (index >= 0 && parent.children[index]) {
      parent.children[index].before(element);
    } else {
      parent.append(element);
    }
  }

  /**
   * @param {HTMLElement} element
   * @param {HTMLElement} parent
   */
  function getIndexInParent(element, parent) {
    return [...parent.children].indexOf(element)
  }

  /**
   * Функция сортировки массива по breakpoint и order
   * по возрастанию для type = min
   * по убыванию для type = max
   *
   * @param {dNode[]} items
   */
  function sortDNodes(items) {
    const isMin = type === 'min' ? 1 : 0;

    return [...items].sort((a, b) => {
      if (a.breakpoint === b.breakpoint) {
        if (a.order === b.order) {
          return 0
        }

        if (a.order === 'first' || b.order === 'last') {
          return -1 * isMin
        }

        if (a.order === 'last' || b.order === 'first') {
          return 1 * isMin
        }

        return 0
      }

      return (a.breakpoint - b.breakpoint) * isMin
    })
  }

  function isNumber(value) {
    return !isNaN(value)
  }
}

// DynamicAdapt

useDynamicAdapt();

function deviceType() {
  const ua = navigator.userAgent;

  // Планшеты
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }

  // Мобильные телефоны
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

function initCheckboxes() {
   // Функция, которая синхронизирует is-checked с input

  function syncCheckbox(container) {
    const input = container.querySelector('.js-checkbox-input');
    if (!input) return;

    const changeState = () => {
        if (input.checked) {
          container.classList.add('is-checked');
        } else {
          container.classList.remove('is-checked');
        }
    };
    changeState();
    // Изначальное состояние

    // Событие изменения
    input.addEventListener('change', () => {
        changeState();
    });

    input.addEventListener('focus', () => {
         requestAnimationFrame(() => {
            if (input.matches(':focus-visible')) {
                container.classList.add('is-focused');
            }
        });
    });

    input.addEventListener('blur', () => {
        container.classList.remove('is-focused');

    });

    container.reset = () => {
        changeState();
    };
  }

  // Инициализация для всех уже существующих чекбоксов
  document.querySelectorAll('.js-checkbox').forEach(syncCheckbox);

  // Отслеживание динамически добавленных чекбоксов
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;

        // Если добавился контейнер .js-checkbox
        if (node.matches('.js-checkbox')) {
          syncCheckbox(node);
        }

        // Если добавился дочерний элемент внутри контейнера
        node.querySelectorAll?.('.js-checkbox').forEach(syncCheckbox);
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

const FIELD_SELECTOR = '.js-base-text-field';
const CONTROL_SELECTOR = '.js-base-text-field-control';
const INPUT_SELECTOR = '.js-base-text-field-input';

function initField(field) {
  // 🔒 защита от повторной инициализации
  if (field.dataset.baseTextFieldInited === 'true') return;
  field.dataset.baseTextFieldInited = 'true';

  const control = field.querySelector(CONTROL_SELECTOR);
  const input = field.querySelector(INPUT_SELECTOR);

  if (!control || !input) return;

  const isDisabled =
    field.classList.contains('is-disabled') || input.disabled;
  const isReadonly =
    field.classList.contains('is-readonly') || input.readOnly;

  // initial state
  field.classList.toggle('is-filled', Boolean(input.value));

  control.addEventListener('mousedown', (e) => {
    if (isDisabled || isReadonly) return;
    if (e.target === input) return;

    input.focus();
    e.preventDefault();
  });

  input.addEventListener('focus', () => {
    if (isDisabled) return;
    field.classList.add('is-focused');
  });

  input.addEventListener('blur', () => {
    field.classList.remove('is-focused');
    field.classList.toggle('is-filled', Boolean(input.value));
  });

  input.addEventListener('input', () => {
    if (isDisabled || isReadonly) return;
    field.classList.toggle('is-filled', Boolean(input.value));
  });

  input.addEventListener('keydown', (e) => {
    if (isDisabled || isReadonly) return;

    if (e.key === 'Enter') {
      field.dispatchEvent(
        new CustomEvent('base-text-field:enter', {
          detail: { value: input.value },
          bubbles: true,
        })
      );
    }
  });

  field.reset = () => {
    if (isDisabled || isReadonly) return;
    input.value = '';
    field.classList.remove('is-filled', 'is-focused');
  };
}

function initBaseTextField(root = document) {
  root
    .querySelectorAll(FIELD_SELECTOR)
    .forEach(initField);
}

/*
	  -------------
	|   ACCORDION   |
	  -------------

	* Basic Attributes:
		* .js-accordions - general wrapper for accordions
		* .js-accordion - accordion block
			** If it is necessary to close neighboring accordions, then specify the data-accordion-one attribute
			** If you want to always display the active accordion (without the possibility of closing), then specify the data-accordion-visible attribute
			** If by default you want to show the accordion, then you need to specify the classes .is-open.is-visible
		* .js-accordion-button - open/close dropdown content button
		* .js-accordion-content - drop-down content
*/

/**
	* @param  {Element} accordionsContainer - HTML container element, default document
	* @param  {number} duration - accordion opening time (also needs to be changed in CSS)
*/
function initAccordions(accordionsContainer, duration = 300) {
	let accordions;

	if (accordionsContainer) {
		if (accordionsContainer instanceof Node) {
			accordions = accordionsContainer.querySelectorAll('.js-accordion');
		}
	} else {
		accordions = document.querySelectorAll('.js-accordion');
	}

    const setAccordion = (accordionEl) => {
        const accordionButton = accordionEl.querySelector('.js-accordion-button');
        const accordionContent = accordionEl.querySelector('.js-accordion-content');
        let isOpen = true;
        const eventOpened = new Event('accordionOpened', {
            detail: {
                accordionEl: accordionEl,
            },
            bubbles: true,
        });
        const eventClosed = new Event('accordionClosed', {
             detail: {
                accordionEl: accordionEl,
            },
            bubbles: true
        });
         const eventStickyRefresh = new CustomEvent('sticky:refresh', {
            bubbles: true,
            detail: { source: 'accordion' }
        });
        const accordionItem = () => {
            isOpen = false;

            if (accordionEl.hasAttribute('data-accordion-one')) {
                const accordionsEl = accordionEl.closest('.js-accordions');
                const accordionActive = accordionsEl ? accordionsEl.querySelector('.js-accordion.is-open') : null;

                if (accordionActive && accordionActive !== accordionEl) {
                    const accordionActiveContent = accordionActive.querySelector('.js-accordion-content');

                    accordionActive.classList.remove('is-open');
                    accordionButton.setAttribute('aria-expanded', 'false');

                    if (accordionActiveContent) {
                        accordionActiveContent.style.maxHeight = `${accordionActiveContent.scrollHeight}px`;

                        accordionActive.classList.remove('is-visible');

                        setTimeout(() => {
                            accordionActiveContent.style.maxHeight = null;
                        }, 1);
                    }
                }
            }

            accordionEl.classList.toggle('is-open');

            accordionContent.style.maxHeight = `${accordionContent.scrollHeight}px`;

            if (accordionEl.classList.contains('is-open')) {
                accordionButton.setAttribute('aria-expanded', 'true');

                setTimeout(() => {
                    accordionEl.classList.add('is-visible');
                    accordionContent.style.maxHeight = null;
                    accordionEl.dispatchEvent(eventOpened);
                    document.dispatchEvent(eventStickyRefresh);

                }, duration);

            } else {
                accordionButton.setAttribute('aria-expanded', 'false');
                accordionEl.classList.remove('is-visible');

                setTimeout(() => {
                    accordionContent.style.maxHeight = null;
                }, 1);

                setTimeout(() => {
                    accordionEl.dispatchEvent(eventClosed);
                    document.dispatchEvent(eventStickyRefresh);

                }, duration);

            }

            setTimeout(() => {
                isOpen = true;

            }, duration);
        };

        accordionEl.classList.add('is-accordion-init');

        if (accordionButton && accordionContent) {
            if (accordionEl.classList.contains('is-open')) {
                accordionButton.setAttribute('aria-expanded', 'true');
            }

            accordionButton.addEventListener('click', (event) => {
                event.preventDefault();

                let isVisible = accordionEl.hasAttribute('data-accordion-visible');

                if (isOpen) {
                    if (isVisible) {
                        if (!accordionEl.classList.contains('is-open')) {
                            accordionItem ();
                        }
                    } else {
                        accordionItem ();
                    }
                }
            });


        }
    };

    const setupAccordions = () => {
        accordions.forEach((accordionEl) => {
            if (!accordionEl.classList.contains('is-accordion-init')) {
                setAccordion(accordionEl);
            }
        });
    };

    setupAccordions();
}

/*
	  --------
	|   TABS   |
	  --------

	* Basic Selectors:
		* .js-tabs - general wrapper for tabs
		* .js-tabs-menu - tab menu
		* .js-tabs-item - menu item
            ** [data-tabs-id] - attribute to set tab id
                *** The attribute value must be unique inside the .js-tabs wrapper
                *** Additionally, you can specify the data-value attribute with the value of the tab name
                    (required to change the text of the button that opens the menu list)
		* .js-tabs-pane - drop-down panel
            ** [data-tabs-pane]- attribute to set tab id
			    *** The value of the attribute must match the value of the data-tabs-id attribute in the .js-tabs-item selector

	* Additional attributes:
		* .js-tabs-list - list of menu items
		* .js-tabs-backdrop - dynamic bar for menu items
		* .js-tabs-prev - back tab navigation
		* .js-tabs-next - forward tab navigation
		* .js-tabs-button - button that opens the menu list (for adaptive)
		* .js-tabs-button-text - the text of the button that opens the menu list (for adaptive)
			** The attribute value is substituted from the active menu item from the data-value attribute
		* .js-tabs-menu-mobile-button-text - alternative button for mobile menu
		* .js-tabs-item-text - text element inside tab item for updating mobile button

	* Functional attributes (can be specified on any HTML element):
		* .js-tabs-switch - adds an HTML element the ability to switch given tabs
			** The value of the attribute must match the value of the data-tabs attribute
		* .js-tabs-switch-pane - an attribute that specifies a specific tab from the data-tabs-pane attribute
*/

/**
    * @param  {Element} tabsContainer - HTML container element, default document
*/
function initTabs(rootEl) {
    let containerEl = document;

    let tabsElements = containerEl.querySelectorAll('.js-tabs');

    if (tabsElements.length) {
        /**
            * Change backdrop
            * @param  {Element} tabsCurrent - HTML element of tabs
            * @param  {Element} tabsBackdrop - HTML backdrop element
        */
        const changeBackdrop = (tabsCurrent, tabsBackdrop) => {
            setTimeout(() => {
                const tabActive = tabsCurrent.querySelector('.js-tabs-item.is-active');

                if (tabsBackdrop && tabActive) {
                    tabsBackdrop.style.width = `${tabActive.offsetWidth}px`;
                    tabsBackdrop.style.left = `${tabActive.offsetLeft}px`;
                }
            }, 10);
        };

        /**
            * Update mobile button text
            * @param  {Element} tabCurrent - Current active tab element
            * @param  {Element} tabsButton - Mobile menu button
            * @param  {Element} mobileButton - Alternative mobile button
        */
        const updateMobileButtonText = (tabCurrent, tabsButton, mobileButton) => {
            // Get text from .js-tabs-item-text inside active tab
            const tabItemText = tabCurrent.querySelector('.js-tabs-item-text');
            let buttonText = '';

            // Priority: .js-tabs-item-text > data-value attribute > empty string
            if (tabItemText) {
                buttonText = tabItemText.textContent.trim();
            } else if (tabCurrent.getAttribute('data-value')) {
                buttonText = tabCurrent.getAttribute('data-value');
            }

            // Update main tabs button text if exists
            if (tabsButton) {
                const tabsButtonText = tabsButton.querySelector('.js-tabs-button-text');
                if (tabsButtonText) {
                    tabsButtonText.textContent = buttonText;
                }
            }

            // Update alternative mobile button text if exists
            if (mobileButton) {
                const mobileButtonText = mobileButton.querySelector('.js-tabs-button-text');
                if (mobileButtonText) {
                    mobileButtonText.textContent = buttonText;
                } else {
                    // If no inner text element, update button's own text content
                    mobileButton.textContent = buttonText;
                }
            }
        };

        /**
            * Change tab
            * @param  {Element} tabs - HTML element of tabs
            * @param  {Element} tabCurrent - Tab panel HTML element
            * @param  {Element} tabsButton - Tab dropdown button HTML element
            * @param  {Element} mobileButton - Alternative mobile button HTML element
        */
        const moveTab = (tabs, tabCurrent, tabsButton, mobileButton) => {
            if (!tabs || !tabCurrent) return;

            const tabActive = tabs.querySelector('.js-tabs-item.is-active');

            let panelActive;
            let panelCurrent = tabs.querySelector(`.js-tabs-pane[data-tabs-pane="${tabCurrent.getAttribute('data-tabs-id')}"]`);

            if (tabActive) {
                tabActive.classList.remove('is-active');
                panelActive = tabs.querySelector(`.js-tabs-pane[data-tabs-pane="${tabActive.getAttribute('data-tabs-id')}"]`);
            }

            if (panelActive) {
                panelActive.classList.remove('is-active');
            }

            tabCurrent.classList.add('is-active');

            if (panelCurrent) {
                panelCurrent.classList.add('is-active');
            }

            // Update button text using the new function
            updateMobileButtonText(tabCurrent, tabsButton, mobileButton);
        };

        /**
            * Close drop down menu of tabs
        */
        const closeTabsList =  () => {
            const tabsButtonActive = document.querySelector('.js-tabs-button.is-active');
            const tabsListActive = document.querySelector('.js-tabs-list.is-active');

            if (tabsButtonActive) {
                tabsButtonActive.classList.remove('is-active');
            }
            if (tabsListActive) {
                tabsListActive.classList.remove('is-active');
            }
        };

        /**
            * Tab navigation
            * @param  {Element} tabs - HTML element of tabs
            * @param  {Element} tabsBackdrop - menu item background HTML element
            * @param  {Element} direction - Tab navigation direction
        */
        const tabNavigation = (tabs, tabsBackdrop, direction) => {
            if (!tabs) return;

            let tabActive = tabs.querySelector('.js-tabs-item.is-active');
            let tabsButton = tabs.querySelector('.js-tabs-button');
            let mobileButton = tabs.querySelector('.js-tabs-menu-mobile-button-text');

            if (tabActive) {
                let tabCurrent = tabActive.nextElementSibling;

                if (direction == 'prev') {
                    tabCurrent = tabActive.previousElementSibling;
                }

                if (tabCurrent) {
                    moveTab(tabs, tabCurrent, tabsButton, mobileButton);

                    if (tabsBackdrop) {
                        changeBackdrop (tabs, tabsBackdrop);
                    }
                }
            }
        };

        /**
            * Checking and changing the disabled attribute of the tab navigation button
            * @param  {Element} tabs - HTML element of tabs
            * @param  {Element} tabNavPrev - Button to move tabs to the left
            * @param  {Element} tabNavNext - Button to move tabs to the right
        */
        const isDisabledTabNavigation = (tabs, tabNavPrev, tabNavNext) => {
            let tabActive = tabs.querySelector('.js-tabs-item.is-active');

            if (tabNavPrev) {
                if (tabActive.previousElementSibling) {
                    tabNavPrev.classList.remove('is-disabled');
                } else {
                    tabNavPrev.classList.add('is-disabled');
                }
            }

            if (tabNavNext) {
                if (tabActive.nextElementSibling) {
                    tabNavNext.classList.remove('is-disabled');
                } else {
                    tabNavNext.classList.add('is-disabled');
                }
            }
        };

        const setTabs = (tabs) => {
            const tabsButton = tabs.querySelector('.js-tabs-button');
            const mobileButton = tabs.querySelector('.js-tabs-menu-mobile-button-text');
            const tabsMenu = tabs.querySelector('.js-tabs-menu');
            const tabsList = tabs.querySelector('.js-tabs-list');
            const tabsItems = tabsMenu ? tabsMenu.querySelectorAll('.js-tabs-item') : '';
            const tabsBackdrop = tabs.querySelector('.js-tabs-backdrop');
            const tabsPrev = tabs.querySelector('.js-tabs-prev');
            const tabsNext = tabs.querySelector('.js-tabs-next');

            tabs.setAttribute('data-tabs-init', '');

            changeBackdrop(tabs, tabsBackdrop);
            isDisabledTabNavigation(tabs, tabsPrev, tabsNext);

            // Initialize active tab text in mobile buttons
            const activeTab = tabs.querySelector('.js-tabs-item.is-active');
            if (activeTab) {
                updateMobileButtonText(activeTab, tabsButton, mobileButton);
            }

            window.addEventListener('resize', () => {
                changeBackdrop(tabs, tabsBackdrop);
            });

            if (tabsItems) {
                tabsItems.forEach(tabItem => {
                    tabItem.addEventListener('click', (event) => {
                        const target = event.currentTarget;

                        moveTab(tabs, target, tabsButton, mobileButton);
                        changeBackdrop(tabs, tabsBackdrop);
                        isDisabledTabNavigation(tabs, tabsPrev, tabsNext);
                    });
                });
            }

            if (tabsPrev) {
                tabsPrev.addEventListener('click', (e) => {
                    e.preventDefault();

                    tabNavigation(tabs, tabsBackdrop, 'prev');
                    isDisabledTabNavigation(tabs, tabsPrev, tabsNext);
                });
            }

            if (tabsNext) {
                tabsNext.addEventListener('click', (e) => {
                    e.preventDefault();

                    tabNavigation(tabs, tabsBackdrop, 'next');
                    isDisabledTabNavigation(tabs, tabsPrev, tabsNext);
                });
            }

            if (tabsButton) {
                tabsButton.addEventListener('click', (e) => {
                    e.preventDefault();

                    tabsButton.classList.toggle('is-active');

                    if (tabsList) {
                        tabsList.classList.toggle('is-active');
                    }
                });
            }
        };

        tabsElements.forEach((tabs) => {
            if (!tabs.hasAttribute('data-tabs-init')) {
                setTabs(tabs);
            }
        });

        window.updateTabs = (wrapperEl) => {
            let containerEl = wrapperEl && wrapperEl instanceof Node ? rootEl : document;

            tabsElements = containerEl.querySelectorAll('.js-tabs');

            if (tabsElements?.length) {
                tabsElements.forEach((tabs) => {
                    if (!tabs.hasAttribute('data-tabs-init')) {
                        setTabs(tabs);
                    }
                });
            }
        };

        document.addEventListener('click', (event) => {
            let target = event.target;
            let targetSwitch = target;

            if (target.classList.contains('js-tabs-switch') || target.closest('.js-tabs-switch')) {
                event.preventDefault();

                if (target.closest('.js-tabs-switch')) {
                    targetSwitch = target.closest('.js-tabs-switch');
                }

                const tabsSwitch = document.querySelector(`.js-tabs[data-tabs="${targetSwitch.getAttribute('data-tabs-switch')}"]`);

                if (tabsSwitch) {
                    const tabsPrev = tabsSwitch.querySelector('.js-tabs-prev');
                    const tabsNext = tabsSwitch.querySelector('.js-tabs-next');
                    const tabCurrent = tabsSwitch.querySelector(`.js-tabs-item[data-tabs-id="${targetSwitch.getAttribute('data-tabs-switch-pane')}"]`);
                    const tabsBackdrop = tabsSwitch.querySelector('.js-tabs-backdrop');
                    const tabsButton = tabsSwitch.querySelector('.js-tabs-button');
                    const mobileButton = tabsSwitch.querySelector('.js-tabs-menu-mobile-button-text');

                    if (tabCurrent) {
                        moveTab(tabsSwitch, tabCurrent, tabsButton, mobileButton);
                        changeBackdrop (tabsSwitch, tabsBackdrop);
                        isDisabledTabNavigation(tabsSwitch, tabsPrev, tabsNext);
                    }
                }
            }

            if (!target.classList.contains('js-tabs-button') && !target.closest('.js-tabs-button')) {
                closeTabsList();
            }
        });
    }
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$2(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now$1 = function() {
  return root.Date.now();
};

/** Used to match a single whitespace character. */
var reWhitespace = /\s/;

/**
 * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the last non-whitespace character.
 */
function trimmedEndIndex(string) {
  var index = string.length;

  while (index-- && reWhitespace.test(string.charAt(index))) {}
  return index;
}

/** Used to match leading whitespace. */
var reTrimStart = /^\s+/;

/**
 * The base implementation of `_.trim`.
 *
 * @private
 * @param {string} string The string to trim.
 * @returns {string} Returns the trimmed string.
 */
function baseTrim(string) {
  return string
    ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '')
    : string;
}

/** Built-in value references. */
var Symbol$1 = root.Symbol;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto$1.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/** Built-in value references. */
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject$2(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject$2(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = baseTrim(value);
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

/** Error message constants. */
var FUNC_ERROR_TEXT$1 = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT$1);
  }
  wait = toNumber(wait) || 0;
  if (isObject$2(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now$1();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now$1());
  }

  function debounced() {
    var time = now$1(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject$2(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

/**
 * simplebar-core - v1.3.2
 * Scrollbars, simpler.
 * https://grsmto.github.io/simplebar/
 *
 * Made by Adrien Denat from a fork by Jonathan Nicol
 * Under MIT License
 */


/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function getElementWindow$1(element) {
    if (!element ||
        !element.ownerDocument ||
        !element.ownerDocument.defaultView) {
        return window;
    }
    return element.ownerDocument.defaultView;
}
function getElementDocument$1(element) {
    if (!element || !element.ownerDocument) {
        return document;
    }
    return element.ownerDocument;
}
// Helper function to retrieve options from element attributes
var getOptions$1 = function (obj) {
    var initialObj = {};
    var options = Array.prototype.reduce.call(obj, function (acc, attribute) {
        var option = attribute.name.match(/data-simplebar-(.+)/);
        if (option) {
            var key = option[1].replace(/\W+(.)/g, function (_, chr) { return chr.toUpperCase(); });
            switch (attribute.value) {
                case 'true':
                    acc[key] = true;
                    break;
                case 'false':
                    acc[key] = false;
                    break;
                case undefined:
                    acc[key] = true;
                    break;
                default:
                    acc[key] = attribute.value;
            }
        }
        return acc;
    }, initialObj);
    return options;
};
function addClasses$1$1(el, classes) {
    var _a;
    if (!el)
        return;
    (_a = el.classList).add.apply(_a, classes.split(' '));
}
function removeClasses$1(el, classes) {
    if (!el)
        return;
    classes.split(' ').forEach(function (className) {
        el.classList.remove(className);
    });
}
function classNamesToQuery$1(classNames) {
    return ".".concat(classNames.split(' ').join('.'));
}
var canUseDOM$1 = !!(typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement);

var helpers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    addClasses: addClasses$1$1,
    canUseDOM: canUseDOM$1,
    classNamesToQuery: classNamesToQuery$1,
    getElementDocument: getElementDocument$1,
    getElementWindow: getElementWindow$1,
    getOptions: getOptions$1,
    removeClasses: removeClasses$1
});

var cachedScrollbarWidth = null;
var cachedDevicePixelRatio = null;
if (canUseDOM$1) {
    window.addEventListener('resize', function () {
        if (cachedDevicePixelRatio !== window.devicePixelRatio) {
            cachedDevicePixelRatio = window.devicePixelRatio;
            cachedScrollbarWidth = null;
        }
    });
}
function scrollbarWidth() {
    if (cachedScrollbarWidth === null) {
        if (typeof document === 'undefined') {
            cachedScrollbarWidth = 0;
            return cachedScrollbarWidth;
        }
        var body = document.body;
        var box = document.createElement('div');
        box.classList.add('simplebar-hide-scrollbar');
        body.appendChild(box);
        var width = box.getBoundingClientRect().right;
        body.removeChild(box);
        cachedScrollbarWidth = width;
    }
    return cachedScrollbarWidth;
}

var getElementWindow = getElementWindow$1, getElementDocument = getElementDocument$1, getOptions$2 = getOptions$1, addClasses$2 = addClasses$1$1, removeClasses$2 = removeClasses$1, classNamesToQuery = classNamesToQuery$1;
var SimpleBarCore = /** @class */ (function () {
    function SimpleBarCore(element, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        this.removePreventClickId = null;
        this.minScrollbarWidth = 20;
        this.stopScrollDelay = 175;
        this.isScrolling = false;
        this.isMouseEntering = false;
        this.isDragging = false;
        this.scrollXTicking = false;
        this.scrollYTicking = false;
        this.wrapperEl = null;
        this.contentWrapperEl = null;
        this.contentEl = null;
        this.offsetEl = null;
        this.maskEl = null;
        this.placeholderEl = null;
        this.heightAutoObserverWrapperEl = null;
        this.heightAutoObserverEl = null;
        this.rtlHelpers = null;
        this.scrollbarWidth = 0;
        this.resizeObserver = null;
        this.mutationObserver = null;
        this.elStyles = null;
        this.isRtl = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.onMouseMove = function () { };
        this.onWindowResize = function () { };
        this.onStopScrolling = function () { };
        this.onMouseEntered = function () { };
        /**
         * On scroll event handling
         */
        this.onScroll = function () {
            var elWindow = getElementWindow(_this.el);
            if (!_this.scrollXTicking) {
                elWindow.requestAnimationFrame(_this.scrollX);
                _this.scrollXTicking = true;
            }
            if (!_this.scrollYTicking) {
                elWindow.requestAnimationFrame(_this.scrollY);
                _this.scrollYTicking = true;
            }
            if (!_this.isScrolling) {
                _this.isScrolling = true;
                addClasses$2(_this.el, _this.classNames.scrolling);
            }
            _this.showScrollbar('x');
            _this.showScrollbar('y');
            _this.onStopScrolling();
        };
        this.scrollX = function () {
            if (_this.axis.x.isOverflowing) {
                _this.positionScrollbar('x');
            }
            _this.scrollXTicking = false;
        };
        this.scrollY = function () {
            if (_this.axis.y.isOverflowing) {
                _this.positionScrollbar('y');
            }
            _this.scrollYTicking = false;
        };
        this._onStopScrolling = function () {
            removeClasses$2(_this.el, _this.classNames.scrolling);
            if (_this.options.autoHide) {
                _this.hideScrollbar('x');
                _this.hideScrollbar('y');
            }
            _this.isScrolling = false;
        };
        this.onMouseEnter = function () {
            if (!_this.isMouseEntering) {
                addClasses$2(_this.el, _this.classNames.mouseEntered);
                _this.showScrollbar('x');
                _this.showScrollbar('y');
                _this.isMouseEntering = true;
            }
            _this.onMouseEntered();
        };
        this._onMouseEntered = function () {
            removeClasses$2(_this.el, _this.classNames.mouseEntered);
            if (_this.options.autoHide) {
                _this.hideScrollbar('x');
                _this.hideScrollbar('y');
            }
            _this.isMouseEntering = false;
        };
        this._onMouseMove = function (e) {
            _this.mouseX = e.clientX;
            _this.mouseY = e.clientY;
            if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
                _this.onMouseMoveForAxis('x');
            }
            if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
                _this.onMouseMoveForAxis('y');
            }
        };
        this.onMouseLeave = function () {
            _this.onMouseMove.cancel();
            if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
                _this.onMouseLeaveForAxis('x');
            }
            if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
                _this.onMouseLeaveForAxis('y');
            }
            _this.mouseX = -1;
            _this.mouseY = -1;
        };
        this._onWindowResize = function () {
            // Recalculate scrollbarWidth in case it's a zoom
            _this.scrollbarWidth = _this.getScrollbarWidth();
            _this.hideNativeScrollbar();
        };
        this.onPointerEvent = function (e) {
            if (!_this.axis.x.track.el ||
                !_this.axis.y.track.el ||
                !_this.axis.x.scrollbar.el ||
                !_this.axis.y.scrollbar.el)
                return;
            var isWithinTrackXBounds, isWithinTrackYBounds;
            _this.axis.x.track.rect = _this.axis.x.track.el.getBoundingClientRect();
            _this.axis.y.track.rect = _this.axis.y.track.el.getBoundingClientRect();
            if (_this.axis.x.isOverflowing || _this.axis.x.forceVisible) {
                isWithinTrackXBounds = _this.isWithinBounds(_this.axis.x.track.rect);
            }
            if (_this.axis.y.isOverflowing || _this.axis.y.forceVisible) {
                isWithinTrackYBounds = _this.isWithinBounds(_this.axis.y.track.rect);
            }
            // If any pointer event is called on the scrollbar
            if (isWithinTrackXBounds || isWithinTrackYBounds) {
                // Prevent event leaking
                e.stopPropagation();
                if (e.type === 'pointerdown' && e.pointerType !== 'touch') {
                    if (isWithinTrackXBounds) {
                        _this.axis.x.scrollbar.rect =
                            _this.axis.x.scrollbar.el.getBoundingClientRect();
                        if (_this.isWithinBounds(_this.axis.x.scrollbar.rect)) {
                            _this.onDragStart(e, 'x');
                        }
                        else {
                            _this.onTrackClick(e, 'x');
                        }
                    }
                    if (isWithinTrackYBounds) {
                        _this.axis.y.scrollbar.rect =
                            _this.axis.y.scrollbar.el.getBoundingClientRect();
                        if (_this.isWithinBounds(_this.axis.y.scrollbar.rect)) {
                            _this.onDragStart(e, 'y');
                        }
                        else {
                            _this.onTrackClick(e, 'y');
                        }
                    }
                }
            }
        };
        /**
         * Drag scrollbar handle
         */
        this.drag = function (e) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            if (!_this.draggedAxis || !_this.contentWrapperEl)
                return;
            var eventOffset;
            var track = _this.axis[_this.draggedAxis].track;
            var trackSize = (_b = (_a = track.rect) === null || _a === void 0 ? void 0 : _a[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _b !== void 0 ? _b : 0;
            var scrollbar = _this.axis[_this.draggedAxis].scrollbar;
            var contentSize = (_d = (_c = _this.contentWrapperEl) === null || _c === void 0 ? void 0 : _c[_this.axis[_this.draggedAxis].scrollSizeAttr]) !== null && _d !== void 0 ? _d : 0;
            var hostSize = parseInt((_f = (_e = _this.elStyles) === null || _e === void 0 ? void 0 : _e[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _f !== void 0 ? _f : '0px', 10);
            e.preventDefault();
            e.stopPropagation();
            if (_this.draggedAxis === 'y') {
                eventOffset = e.pageY;
            }
            else {
                eventOffset = e.pageX;
            }
            // Calculate how far the user's mouse is from the top/left of the scrollbar (minus the dragOffset).
            var dragPos = eventOffset -
                ((_h = (_g = track.rect) === null || _g === void 0 ? void 0 : _g[_this.axis[_this.draggedAxis].offsetAttr]) !== null && _h !== void 0 ? _h : 0) -
                _this.axis[_this.draggedAxis].dragOffset;
            dragPos =
                _this.draggedAxis === 'x' && _this.isRtl
                    ? ((_k = (_j = track.rect) === null || _j === void 0 ? void 0 : _j[_this.axis[_this.draggedAxis].sizeAttr]) !== null && _k !== void 0 ? _k : 0) -
                        scrollbar.size -
                        dragPos
                    : dragPos;
            // Convert the mouse position into a percentage of the scrollbar height/width.
            var dragPerc = dragPos / (trackSize - scrollbar.size);
            // Scroll the content by the same percentage.
            var scrollPos = dragPerc * (contentSize - hostSize);
            // Fix browsers inconsistency on RTL
            if (_this.draggedAxis === 'x' && _this.isRtl) {
                scrollPos = ((_l = SimpleBarCore.getRtlHelpers()) === null || _l === void 0 ? void 0 : _l.isScrollingToNegative)
                    ? -scrollPos
                    : scrollPos;
            }
            _this.contentWrapperEl[_this.axis[_this.draggedAxis].scrollOffsetAttr] =
                scrollPos;
        };
        /**
         * End scroll handle drag
         */
        this.onEndDrag = function (e) {
            _this.isDragging = false;
            var elDocument = getElementDocument(_this.el);
            var elWindow = getElementWindow(_this.el);
            e.preventDefault();
            e.stopPropagation();
            removeClasses$2(_this.el, _this.classNames.dragging);
            _this.onStopScrolling();
            elDocument.removeEventListener('mousemove', _this.drag, true);
            elDocument.removeEventListener('mouseup', _this.onEndDrag, true);
            _this.removePreventClickId = elWindow.setTimeout(function () {
                // Remove these asynchronously so we still suppress click events
                // generated simultaneously with mouseup.
                elDocument.removeEventListener('click', _this.preventClick, true);
                elDocument.removeEventListener('dblclick', _this.preventClick, true);
                _this.removePreventClickId = null;
            });
        };
        /**
         * Handler to ignore click events during drag
         */
        this.preventClick = function (e) {
            e.preventDefault();
            e.stopPropagation();
        };
        this.el = element;
        this.options = __assign(__assign({}, SimpleBarCore.defaultOptions), options);
        this.classNames = __assign(__assign({}, SimpleBarCore.defaultOptions.classNames), options.classNames);
        this.axis = {
            x: {
                scrollOffsetAttr: 'scrollLeft',
                sizeAttr: 'width',
                scrollSizeAttr: 'scrollWidth',
                offsetSizeAttr: 'offsetWidth',
                offsetAttr: 'left',
                overflowAttr: 'overflowX',
                dragOffset: 0,
                isOverflowing: true,
                forceVisible: false,
                track: { size: null, el: null, rect: null, isVisible: false },
                scrollbar: { size: null, el: null, rect: null, isVisible: false }
            },
            y: {
                scrollOffsetAttr: 'scrollTop',
                sizeAttr: 'height',
                scrollSizeAttr: 'scrollHeight',
                offsetSizeAttr: 'offsetHeight',
                offsetAttr: 'top',
                overflowAttr: 'overflowY',
                dragOffset: 0,
                isOverflowing: true,
                forceVisible: false,
                track: { size: null, el: null, rect: null, isVisible: false },
                scrollbar: { size: null, el: null, rect: null, isVisible: false }
            }
        };
        if (typeof this.el !== 'object' || !this.el.nodeName) {
            throw new Error("Argument passed to SimpleBar must be an HTML element instead of ".concat(this.el));
        }
        this.onMouseMove = throttle(this._onMouseMove, 64);
        this.onWindowResize = debounce(this._onWindowResize, 64, { leading: true });
        this.onStopScrolling = debounce(this._onStopScrolling, this.stopScrollDelay);
        this.onMouseEntered = debounce(this._onMouseEntered, this.stopScrollDelay);
        this.init();
    }
    /**
     * Helper to fix browsers inconsistency on RTL:
     *  - Firefox inverts the scrollbar initial position
     *  - IE11 inverts both scrollbar position and scrolling offset
     * Directly inspired by @KingSora's OverlayScrollbars https://github.com/KingSora/OverlayScrollbars/blob/master/js/OverlayScrollbars.js#L1634
     */
    SimpleBarCore.getRtlHelpers = function () {
        if (SimpleBarCore.rtlHelpers) {
            return SimpleBarCore.rtlHelpers;
        }
        var dummyDiv = document.createElement('div');
        dummyDiv.innerHTML =
            '<div class="simplebar-dummy-scrollbar-size"><div></div></div>';
        var scrollbarDummyEl = dummyDiv.firstElementChild;
        var dummyChild = scrollbarDummyEl === null || scrollbarDummyEl === void 0 ? void 0 : scrollbarDummyEl.firstElementChild;
        if (!dummyChild)
            return null;
        document.body.appendChild(scrollbarDummyEl);
        scrollbarDummyEl.scrollLeft = 0;
        var dummyContainerOffset = SimpleBarCore.getOffset(scrollbarDummyEl);
        var dummyChildOffset = SimpleBarCore.getOffset(dummyChild);
        scrollbarDummyEl.scrollLeft = -999;
        var dummyChildOffsetAfterScroll = SimpleBarCore.getOffset(dummyChild);
        document.body.removeChild(scrollbarDummyEl);
        SimpleBarCore.rtlHelpers = {
            // determines if the scrolling is responding with negative values
            isScrollOriginAtZero: dummyContainerOffset.left !== dummyChildOffset.left,
            // determines if the origin scrollbar position is inverted or not (positioned on left or right)
            isScrollingToNegative: dummyChildOffset.left !== dummyChildOffsetAfterScroll.left
        };
        return SimpleBarCore.rtlHelpers;
    };
    SimpleBarCore.prototype.getScrollbarWidth = function () {
        // Try/catch for FF 56 throwing on undefined computedStyles
        try {
            // Detect browsers supporting CSS scrollbar styling and do not calculate
            if ((this.contentWrapperEl &&
                getComputedStyle(this.contentWrapperEl, '::-webkit-scrollbar')
                    .display === 'none') ||
                'scrollbarWidth' in document.documentElement.style ||
                '-ms-overflow-style' in document.documentElement.style) {
                return 0;
            }
            else {
                return scrollbarWidth();
            }
        }
        catch (e) {
            return scrollbarWidth();
        }
    };
    SimpleBarCore.getOffset = function (el) {
        var rect = el.getBoundingClientRect();
        var elDocument = getElementDocument(el);
        var elWindow = getElementWindow(el);
        return {
            top: rect.top +
                (elWindow.pageYOffset || elDocument.documentElement.scrollTop),
            left: rect.left +
                (elWindow.pageXOffset || elDocument.documentElement.scrollLeft)
        };
    };
    SimpleBarCore.prototype.init = function () {
        // We stop here on server-side
        if (canUseDOM$1) {
            this.initDOM();
            this.rtlHelpers = SimpleBarCore.getRtlHelpers();
            this.scrollbarWidth = this.getScrollbarWidth();
            this.recalculate();
            this.initListeners();
        }
    };
    SimpleBarCore.prototype.initDOM = function () {
        var _a, _b;
        // assume that element has his DOM already initiated
        this.wrapperEl = this.el.querySelector(classNamesToQuery(this.classNames.wrapper));
        this.contentWrapperEl =
            this.options.scrollableNode ||
                this.el.querySelector(classNamesToQuery(this.classNames.contentWrapper));
        this.contentEl =
            this.options.contentNode ||
                this.el.querySelector(classNamesToQuery(this.classNames.contentEl));
        this.offsetEl = this.el.querySelector(classNamesToQuery(this.classNames.offset));
        this.maskEl = this.el.querySelector(classNamesToQuery(this.classNames.mask));
        this.placeholderEl = this.findChild(this.wrapperEl, classNamesToQuery(this.classNames.placeholder));
        this.heightAutoObserverWrapperEl = this.el.querySelector(classNamesToQuery(this.classNames.heightAutoObserverWrapperEl));
        this.heightAutoObserverEl = this.el.querySelector(classNamesToQuery(this.classNames.heightAutoObserverEl));
        this.axis.x.track.el = this.findChild(this.el, "".concat(classNamesToQuery(this.classNames.track)).concat(classNamesToQuery(this.classNames.horizontal)));
        this.axis.y.track.el = this.findChild(this.el, "".concat(classNamesToQuery(this.classNames.track)).concat(classNamesToQuery(this.classNames.vertical)));
        this.axis.x.scrollbar.el =
            ((_a = this.axis.x.track.el) === null || _a === void 0 ? void 0 : _a.querySelector(classNamesToQuery(this.classNames.scrollbar))) || null;
        this.axis.y.scrollbar.el =
            ((_b = this.axis.y.track.el) === null || _b === void 0 ? void 0 : _b.querySelector(classNamesToQuery(this.classNames.scrollbar))) || null;
        if (!this.options.autoHide) {
            addClasses$2(this.axis.x.scrollbar.el, this.classNames.visible);
            addClasses$2(this.axis.y.scrollbar.el, this.classNames.visible);
        }
    };
    SimpleBarCore.prototype.initListeners = function () {
        var _this = this;
        var _a;
        var elWindow = getElementWindow(this.el);
        // Event listeners
        this.el.addEventListener('mouseenter', this.onMouseEnter);
        this.el.addEventListener('pointerdown', this.onPointerEvent, true);
        this.el.addEventListener('mousemove', this.onMouseMove);
        this.el.addEventListener('mouseleave', this.onMouseLeave);
        (_a = this.contentWrapperEl) === null || _a === void 0 ? void 0 : _a.addEventListener('scroll', this.onScroll);
        // Browser zoom triggers a window resize
        elWindow.addEventListener('resize', this.onWindowResize);
        if (!this.contentEl)
            return;
        if (window.ResizeObserver) {
            // Hack for https://github.com/WICG/ResizeObserver/issues/38
            var resizeObserverStarted_1 = false;
            var resizeObserver = elWindow.ResizeObserver || ResizeObserver;
            this.resizeObserver = new resizeObserver(function () {
                if (!resizeObserverStarted_1)
                    return;
                elWindow.requestAnimationFrame(function () {
                    _this.recalculate();
                });
            });
            this.resizeObserver.observe(this.el);
            this.resizeObserver.observe(this.contentEl);
            elWindow.requestAnimationFrame(function () {
                resizeObserverStarted_1 = true;
            });
        }
        // This is required to detect horizontal scroll. Vertical scroll only needs the resizeObserver.
        this.mutationObserver = new elWindow.MutationObserver(function () {
            elWindow.requestAnimationFrame(function () {
                _this.recalculate();
            });
        });
        this.mutationObserver.observe(this.contentEl, {
            childList: true,
            subtree: true,
            characterData: true
        });
    };
    SimpleBarCore.prototype.recalculate = function () {
        if (!this.heightAutoObserverEl ||
            !this.contentEl ||
            !this.contentWrapperEl ||
            !this.wrapperEl ||
            !this.placeholderEl)
            return;
        var elWindow = getElementWindow(this.el);
        this.elStyles = elWindow.getComputedStyle(this.el);
        this.isRtl = this.elStyles.direction === 'rtl';
        var contentElOffsetWidth = this.contentEl.offsetWidth;
        var isHeightAuto = this.heightAutoObserverEl.offsetHeight <= 1;
        var isWidthAuto = this.heightAutoObserverEl.offsetWidth <= 1 || contentElOffsetWidth > 0;
        var contentWrapperElOffsetWidth = this.contentWrapperEl.offsetWidth;
        var elOverflowX = this.elStyles.overflowX;
        var elOverflowY = this.elStyles.overflowY;
        this.contentEl.style.padding = "".concat(this.elStyles.paddingTop, " ").concat(this.elStyles.paddingRight, " ").concat(this.elStyles.paddingBottom, " ").concat(this.elStyles.paddingLeft);
        this.wrapperEl.style.margin = "-".concat(this.elStyles.paddingTop, " -").concat(this.elStyles.paddingRight, " -").concat(this.elStyles.paddingBottom, " -").concat(this.elStyles.paddingLeft);
        var contentElScrollHeight = this.contentEl.scrollHeight;
        var contentElScrollWidth = this.contentEl.scrollWidth;
        this.contentWrapperEl.style.height = isHeightAuto ? 'auto' : '100%';
        // Determine placeholder size
        this.placeholderEl.style.width = isWidthAuto
            ? "".concat(contentElOffsetWidth || contentElScrollWidth, "px")
            : 'auto';
        this.placeholderEl.style.height = "".concat(contentElScrollHeight, "px");
        var contentWrapperElOffsetHeight = this.contentWrapperEl.offsetHeight;
        this.axis.x.isOverflowing =
            contentElOffsetWidth !== 0 && contentElScrollWidth > contentElOffsetWidth;
        this.axis.y.isOverflowing =
            contentElScrollHeight > contentWrapperElOffsetHeight;
        // Set isOverflowing to false if user explicitely set hidden overflow
        this.axis.x.isOverflowing =
            elOverflowX === 'hidden' ? false : this.axis.x.isOverflowing;
        this.axis.y.isOverflowing =
            elOverflowY === 'hidden' ? false : this.axis.y.isOverflowing;
        this.axis.x.forceVisible =
            this.options.forceVisible === 'x' || this.options.forceVisible === true;
        this.axis.y.forceVisible =
            this.options.forceVisible === 'y' || this.options.forceVisible === true;
        this.hideNativeScrollbar();
        // Set isOverflowing to false if scrollbar is not necessary (content is shorter than offset)
        var offsetForXScrollbar = this.axis.x.isOverflowing
            ? this.scrollbarWidth
            : 0;
        var offsetForYScrollbar = this.axis.y.isOverflowing
            ? this.scrollbarWidth
            : 0;
        this.axis.x.isOverflowing =
            this.axis.x.isOverflowing &&
                contentElScrollWidth > contentWrapperElOffsetWidth - offsetForYScrollbar;
        this.axis.y.isOverflowing =
            this.axis.y.isOverflowing &&
                contentElScrollHeight >
                    contentWrapperElOffsetHeight - offsetForXScrollbar;
        this.axis.x.scrollbar.size = this.getScrollbarSize('x');
        this.axis.y.scrollbar.size = this.getScrollbarSize('y');
        if (this.axis.x.scrollbar.el)
            this.axis.x.scrollbar.el.style.width = "".concat(this.axis.x.scrollbar.size, "px");
        if (this.axis.y.scrollbar.el)
            this.axis.y.scrollbar.el.style.height = "".concat(this.axis.y.scrollbar.size, "px");
        this.positionScrollbar('x');
        this.positionScrollbar('y');
        this.toggleTrackVisibility('x');
        this.toggleTrackVisibility('y');
    };
    /**
     * Calculate scrollbar size
     */
    SimpleBarCore.prototype.getScrollbarSize = function (axis) {
        var _a, _b;
        if (axis === void 0) { axis = 'y'; }
        if (!this.axis[axis].isOverflowing || !this.contentEl) {
            return 0;
        }
        var contentSize = this.contentEl[this.axis[axis].scrollSizeAttr];
        var trackSize = (_b = (_a = this.axis[axis].track.el) === null || _a === void 0 ? void 0 : _a[this.axis[axis].offsetSizeAttr]) !== null && _b !== void 0 ? _b : 0;
        var scrollbarRatio = trackSize / contentSize;
        var scrollbarSize;
        // Calculate new height/position of drag handle.
        scrollbarSize = Math.max(~~(scrollbarRatio * trackSize), this.options.scrollbarMinSize);
        if (this.options.scrollbarMaxSize) {
            scrollbarSize = Math.min(scrollbarSize, this.options.scrollbarMaxSize);
        }
        return scrollbarSize;
    };
    SimpleBarCore.prototype.positionScrollbar = function (axis) {
        var _a, _b, _c;
        if (axis === void 0) { axis = 'y'; }
        var scrollbar = this.axis[axis].scrollbar;
        if (!this.axis[axis].isOverflowing ||
            !this.contentWrapperEl ||
            !scrollbar.el ||
            !this.elStyles) {
            return;
        }
        var contentSize = this.contentWrapperEl[this.axis[axis].scrollSizeAttr];
        var trackSize = ((_a = this.axis[axis].track.el) === null || _a === void 0 ? void 0 : _a[this.axis[axis].offsetSizeAttr]) || 0;
        var hostSize = parseInt(this.elStyles[this.axis[axis].sizeAttr], 10);
        var scrollOffset = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
        scrollOffset =
            axis === 'x' &&
                this.isRtl &&
                ((_b = SimpleBarCore.getRtlHelpers()) === null || _b === void 0 ? void 0 : _b.isScrollOriginAtZero)
                ? -scrollOffset
                : scrollOffset;
        if (axis === 'x' && this.isRtl) {
            scrollOffset = ((_c = SimpleBarCore.getRtlHelpers()) === null || _c === void 0 ? void 0 : _c.isScrollingToNegative)
                ? scrollOffset
                : -scrollOffset;
        }
        var scrollPourcent = scrollOffset / (contentSize - hostSize);
        var handleOffset = ~~((trackSize - scrollbar.size) * scrollPourcent);
        handleOffset =
            axis === 'x' && this.isRtl
                ? -handleOffset + (trackSize - scrollbar.size)
                : handleOffset;
        scrollbar.el.style.transform =
            axis === 'x'
                ? "translate3d(".concat(handleOffset, "px, 0, 0)")
                : "translate3d(0, ".concat(handleOffset, "px, 0)");
    };
    SimpleBarCore.prototype.toggleTrackVisibility = function (axis) {
        if (axis === void 0) { axis = 'y'; }
        var track = this.axis[axis].track.el;
        var scrollbar = this.axis[axis].scrollbar.el;
        if (!track || !scrollbar || !this.contentWrapperEl)
            return;
        if (this.axis[axis].isOverflowing || this.axis[axis].forceVisible) {
            track.style.visibility = 'visible';
            this.contentWrapperEl.style[this.axis[axis].overflowAttr] = 'scroll';
            this.el.classList.add("".concat(this.classNames.scrollable, "-").concat(axis));
        }
        else {
            track.style.visibility = 'hidden';
            this.contentWrapperEl.style[this.axis[axis].overflowAttr] = 'hidden';
            this.el.classList.remove("".concat(this.classNames.scrollable, "-").concat(axis));
        }
        // Even if forceVisible is enabled, scrollbar itself should be hidden
        if (this.axis[axis].isOverflowing) {
            scrollbar.style.display = 'block';
        }
        else {
            scrollbar.style.display = 'none';
        }
    };
    SimpleBarCore.prototype.showScrollbar = function (axis) {
        if (axis === void 0) { axis = 'y'; }
        if (this.axis[axis].isOverflowing && !this.axis[axis].scrollbar.isVisible) {
            addClasses$2(this.axis[axis].scrollbar.el, this.classNames.visible);
            this.axis[axis].scrollbar.isVisible = true;
        }
    };
    SimpleBarCore.prototype.hideScrollbar = function (axis) {
        if (axis === void 0) { axis = 'y'; }
        if (this.isDragging)
            return;
        if (this.axis[axis].isOverflowing && this.axis[axis].scrollbar.isVisible) {
            removeClasses$2(this.axis[axis].scrollbar.el, this.classNames.visible);
            this.axis[axis].scrollbar.isVisible = false;
        }
    };
    SimpleBarCore.prototype.hideNativeScrollbar = function () {
        if (!this.offsetEl)
            return;
        this.offsetEl.style[this.isRtl ? 'left' : 'right'] =
            this.axis.y.isOverflowing || this.axis.y.forceVisible
                ? "-".concat(this.scrollbarWidth, "px")
                : '0px';
        this.offsetEl.style.bottom =
            this.axis.x.isOverflowing || this.axis.x.forceVisible
                ? "-".concat(this.scrollbarWidth, "px")
                : '0px';
    };
    SimpleBarCore.prototype.onMouseMoveForAxis = function (axis) {
        if (axis === void 0) { axis = 'y'; }
        var currentAxis = this.axis[axis];
        if (!currentAxis.track.el || !currentAxis.scrollbar.el)
            return;
        currentAxis.track.rect = currentAxis.track.el.getBoundingClientRect();
        currentAxis.scrollbar.rect =
            currentAxis.scrollbar.el.getBoundingClientRect();
        if (this.isWithinBounds(currentAxis.track.rect)) {
            this.showScrollbar(axis);
            addClasses$2(currentAxis.track.el, this.classNames.hover);
            if (this.isWithinBounds(currentAxis.scrollbar.rect)) {
                addClasses$2(currentAxis.scrollbar.el, this.classNames.hover);
            }
            else {
                removeClasses$2(currentAxis.scrollbar.el, this.classNames.hover);
            }
        }
        else {
            removeClasses$2(currentAxis.track.el, this.classNames.hover);
            if (this.options.autoHide) {
                this.hideScrollbar(axis);
            }
        }
    };
    SimpleBarCore.prototype.onMouseLeaveForAxis = function (axis) {
        if (axis === void 0) { axis = 'y'; }
        removeClasses$2(this.axis[axis].track.el, this.classNames.hover);
        removeClasses$2(this.axis[axis].scrollbar.el, this.classNames.hover);
        if (this.options.autoHide) {
            this.hideScrollbar(axis);
        }
    };
    /**
     * on scrollbar handle drag movement starts
     */
    SimpleBarCore.prototype.onDragStart = function (e, axis) {
        var _a;
        if (axis === void 0) { axis = 'y'; }
        this.isDragging = true;
        var elDocument = getElementDocument(this.el);
        var elWindow = getElementWindow(this.el);
        var scrollbar = this.axis[axis].scrollbar;
        // Measure how far the user's mouse is from the top of the scrollbar drag handle.
        var eventOffset = axis === 'y' ? e.pageY : e.pageX;
        this.axis[axis].dragOffset =
            eventOffset - (((_a = scrollbar.rect) === null || _a === void 0 ? void 0 : _a[this.axis[axis].offsetAttr]) || 0);
        this.draggedAxis = axis;
        addClasses$2(this.el, this.classNames.dragging);
        elDocument.addEventListener('mousemove', this.drag, true);
        elDocument.addEventListener('mouseup', this.onEndDrag, true);
        if (this.removePreventClickId === null) {
            elDocument.addEventListener('click', this.preventClick, true);
            elDocument.addEventListener('dblclick', this.preventClick, true);
        }
        else {
            elWindow.clearTimeout(this.removePreventClickId);
            this.removePreventClickId = null;
        }
    };
    SimpleBarCore.prototype.onTrackClick = function (e, axis) {
        var _this = this;
        var _a, _b, _c, _d;
        if (axis === void 0) { axis = 'y'; }
        var currentAxis = this.axis[axis];
        if (!this.options.clickOnTrack ||
            !currentAxis.scrollbar.el ||
            !this.contentWrapperEl)
            return;
        // Preventing the event's default to trigger click underneath
        e.preventDefault();
        var elWindow = getElementWindow(this.el);
        this.axis[axis].scrollbar.rect =
            currentAxis.scrollbar.el.getBoundingClientRect();
        var scrollbar = this.axis[axis].scrollbar;
        var scrollbarOffset = (_b = (_a = scrollbar.rect) === null || _a === void 0 ? void 0 : _a[this.axis[axis].offsetAttr]) !== null && _b !== void 0 ? _b : 0;
        var hostSize = parseInt((_d = (_c = this.elStyles) === null || _c === void 0 ? void 0 : _c[this.axis[axis].sizeAttr]) !== null && _d !== void 0 ? _d : '0px', 10);
        var scrolled = this.contentWrapperEl[this.axis[axis].scrollOffsetAttr];
        var t = axis === 'y'
            ? this.mouseY - scrollbarOffset
            : this.mouseX - scrollbarOffset;
        var dir = t < 0 ? -1 : 1;
        var scrollSize = dir === -1 ? scrolled - hostSize : scrolled + hostSize;
        var speed = 40;
        var scrollTo = function () {
            if (!_this.contentWrapperEl)
                return;
            if (dir === -1) {
                if (scrolled > scrollSize) {
                    scrolled -= speed;
                    _this.contentWrapperEl[_this.axis[axis].scrollOffsetAttr] = scrolled;
                    elWindow.requestAnimationFrame(scrollTo);
                }
            }
            else {
                if (scrolled < scrollSize) {
                    scrolled += speed;
                    _this.contentWrapperEl[_this.axis[axis].scrollOffsetAttr] = scrolled;
                    elWindow.requestAnimationFrame(scrollTo);
                }
            }
        };
        scrollTo();
    };
    /**
     * Getter for content element
     */
    SimpleBarCore.prototype.getContentElement = function () {
        return this.contentEl;
    };
    /**
     * Getter for original scrolling element
     */
    SimpleBarCore.prototype.getScrollElement = function () {
        return this.contentWrapperEl;
    };
    SimpleBarCore.prototype.removeListeners = function () {
        var elWindow = getElementWindow(this.el);
        // Event listeners
        this.el.removeEventListener('mouseenter', this.onMouseEnter);
        this.el.removeEventListener('pointerdown', this.onPointerEvent, true);
        this.el.removeEventListener('mousemove', this.onMouseMove);
        this.el.removeEventListener('mouseleave', this.onMouseLeave);
        if (this.contentWrapperEl) {
            this.contentWrapperEl.removeEventListener('scroll', this.onScroll);
        }
        elWindow.removeEventListener('resize', this.onWindowResize);
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        // Cancel all debounced functions
        this.onMouseMove.cancel();
        this.onWindowResize.cancel();
        this.onStopScrolling.cancel();
        this.onMouseEntered.cancel();
    };
    /**
     * Remove all listeners from DOM nodes
     */
    SimpleBarCore.prototype.unMount = function () {
        this.removeListeners();
    };
    /**
     * Check if mouse is within bounds
     */
    SimpleBarCore.prototype.isWithinBounds = function (bbox) {
        return (this.mouseX >= bbox.left &&
            this.mouseX <= bbox.left + bbox.width &&
            this.mouseY >= bbox.top &&
            this.mouseY <= bbox.top + bbox.height);
    };
    /**
     * Find element children matches query
     */
    SimpleBarCore.prototype.findChild = function (el, query) {
        var matches = el.matches ||
            el.webkitMatchesSelector ||
            el.mozMatchesSelector ||
            el.msMatchesSelector;
        return Array.prototype.filter.call(el.children, function (child) {
            return matches.call(child, query);
        })[0];
    };
    SimpleBarCore.rtlHelpers = null;
    SimpleBarCore.defaultOptions = {
        forceVisible: false,
        clickOnTrack: true,
        scrollbarMinSize: 25,
        scrollbarMaxSize: 0,
        ariaLabel: 'scrollable content',
        tabIndex: 0,
        classNames: {
            contentEl: 'simplebar-content',
            contentWrapper: 'simplebar-content-wrapper',
            offset: 'simplebar-offset',
            mask: 'simplebar-mask',
            wrapper: 'simplebar-wrapper',
            placeholder: 'simplebar-placeholder',
            scrollbar: 'simplebar-scrollbar',
            track: 'simplebar-track',
            heightAutoObserverWrapperEl: 'simplebar-height-auto-observer-wrapper',
            heightAutoObserverEl: 'simplebar-height-auto-observer',
            visible: 'simplebar-visible',
            horizontal: 'simplebar-horizontal',
            vertical: 'simplebar-vertical',
            hover: 'simplebar-hover',
            dragging: 'simplebar-dragging',
            scrolling: 'simplebar-scrolling',
            scrollable: 'simplebar-scrollable',
            mouseEntered: 'simplebar-mouse-entered'
        },
        scrollableNode: null,
        contentNode: null,
        autoHide: true
    };
    /**
     * Static functions
     */
    SimpleBarCore.getOptions = getOptions$2;
    SimpleBarCore.helpers = helpers;
    return SimpleBarCore;
}());

/**
 * simplebar - v6.3.3
 * Scrollbars, simpler.
 * https://grsmto.github.io/simplebar/
 *
 * Made by Adrien Denat from a fork by Jonathan Nicol
 * Under MIT License
 */


/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var _a = SimpleBarCore.helpers, getOptions = _a.getOptions, addClasses$1 = _a.addClasses, canUseDOM = _a.canUseDOM;
var SimpleBar = /** @class */ (function (_super) {
    __extends(SimpleBar, _super);
    function SimpleBar() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.apply(this, args) || this;
        // // Save a reference to the instance, so we know this DOM node has already been instancied
        SimpleBar.instances.set(args[0], _this);
        return _this;
    }
    SimpleBar.initDOMLoadedElements = function () {
        document.removeEventListener('DOMContentLoaded', this.initDOMLoadedElements);
        window.removeEventListener('load', this.initDOMLoadedElements);
        Array.prototype.forEach.call(document.querySelectorAll('[data-simplebar]'), function (el) {
            if (el.getAttribute('data-simplebar') !== 'init' &&
                !SimpleBar.instances.has(el))
                new SimpleBar(el, getOptions(el.attributes));
        });
    };
    SimpleBar.removeObserver = function () {
        var _a;
        (_a = SimpleBar.globalObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
    };
    SimpleBar.prototype.initDOM = function () {
        var _this = this;
        var _a, _b, _c;
        // make sure this element doesn't have the elements yet
        if (!Array.prototype.filter.call(this.el.children, function (child) {
            return child.classList.contains(_this.classNames.wrapper);
        }).length) {
            // Prepare DOM
            this.wrapperEl = document.createElement('div');
            this.contentWrapperEl = document.createElement('div');
            this.offsetEl = document.createElement('div');
            this.maskEl = document.createElement('div');
            this.contentEl = document.createElement('div');
            this.placeholderEl = document.createElement('div');
            this.heightAutoObserverWrapperEl = document.createElement('div');
            this.heightAutoObserverEl = document.createElement('div');
            addClasses$1(this.wrapperEl, this.classNames.wrapper);
            addClasses$1(this.contentWrapperEl, this.classNames.contentWrapper);
            addClasses$1(this.offsetEl, this.classNames.offset);
            addClasses$1(this.maskEl, this.classNames.mask);
            addClasses$1(this.contentEl, this.classNames.contentEl);
            addClasses$1(this.placeholderEl, this.classNames.placeholder);
            addClasses$1(this.heightAutoObserverWrapperEl, this.classNames.heightAutoObserverWrapperEl);
            addClasses$1(this.heightAutoObserverEl, this.classNames.heightAutoObserverEl);
            while (this.el.firstChild) {
                this.contentEl.appendChild(this.el.firstChild);
            }
            this.contentWrapperEl.appendChild(this.contentEl);
            this.offsetEl.appendChild(this.contentWrapperEl);
            this.maskEl.appendChild(this.offsetEl);
            this.heightAutoObserverWrapperEl.appendChild(this.heightAutoObserverEl);
            this.wrapperEl.appendChild(this.heightAutoObserverWrapperEl);
            this.wrapperEl.appendChild(this.maskEl);
            this.wrapperEl.appendChild(this.placeholderEl);
            this.el.appendChild(this.wrapperEl);
            (_a = this.contentWrapperEl) === null || _a === void 0 ? void 0 : _a.setAttribute('tabindex', this.options.tabIndex.toString());
            (_b = this.contentWrapperEl) === null || _b === void 0 ? void 0 : _b.setAttribute('role', 'region');
            (_c = this.contentWrapperEl) === null || _c === void 0 ? void 0 : _c.setAttribute('aria-label', this.options.ariaLabel);
        }
        if (!this.axis.x.track.el || !this.axis.y.track.el) {
            var track = document.createElement('div');
            var scrollbar = document.createElement('div');
            addClasses$1(track, this.classNames.track);
            addClasses$1(scrollbar, this.classNames.scrollbar);
            track.appendChild(scrollbar);
            this.axis.x.track.el = track.cloneNode(true);
            addClasses$1(this.axis.x.track.el, this.classNames.horizontal);
            this.axis.y.track.el = track.cloneNode(true);
            addClasses$1(this.axis.y.track.el, this.classNames.vertical);
            this.el.appendChild(this.axis.x.track.el);
            this.el.appendChild(this.axis.y.track.el);
        }
        SimpleBarCore.prototype.initDOM.call(this);
        this.el.setAttribute('data-simplebar', 'init');
    };
    SimpleBar.prototype.unMount = function () {
        SimpleBarCore.prototype.unMount.call(this);
        SimpleBar.instances["delete"](this.el);
    };
    SimpleBar.initHtmlApi = function () {
        this.initDOMLoadedElements = this.initDOMLoadedElements.bind(this);
        // MutationObserver is IE11+
        if (typeof MutationObserver !== 'undefined') {
            // Mutation observer to observe dynamically added elements
            this.globalObserver = new MutationObserver(SimpleBar.handleMutations);
            this.globalObserver.observe(document, { childList: true, subtree: true });
        }
        // Taken from jQuery `ready` function
        // Instantiate elements already present on the page
        if (document.readyState === 'complete' || // @ts-ignore: IE specific
            (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
            // Handle it asynchronously to allow scripts the opportunity to delay init
            window.setTimeout(this.initDOMLoadedElements);
        }
        else {
            document.addEventListener('DOMContentLoaded', this.initDOMLoadedElements);
            window.addEventListener('load', this.initDOMLoadedElements);
        }
    };
    SimpleBar.handleMutations = function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (addedNode) {
                if (addedNode.nodeType === 1) {
                    if (addedNode.hasAttribute('data-simplebar')) {
                        !SimpleBar.instances.has(addedNode) &&
                            document.documentElement.contains(addedNode) &&
                            new SimpleBar(addedNode, getOptions(addedNode.attributes));
                    }
                    else {
                        addedNode
                            .querySelectorAll('[data-simplebar]')
                            .forEach(function (el) {
                            if (el.getAttribute('data-simplebar') !== 'init' &&
                                !SimpleBar.instances.has(el) &&
                                document.documentElement.contains(el))
                                new SimpleBar(el, getOptions(el.attributes));
                        });
                    }
                }
            });
            mutation.removedNodes.forEach(function (removedNode) {
                var _a;
                if (removedNode.nodeType === 1) {
                    if (removedNode.getAttribute('data-simplebar') === 'init') {
                        !document.documentElement.contains(removedNode) &&
                            ((_a = SimpleBar.instances.get(removedNode)) === null || _a === void 0 ? void 0 : _a.unMount());
                    }
                    else {
                        Array.prototype.forEach.call(removedNode.querySelectorAll('[data-simplebar="init"]'), function (el) {
                            var _a;
                            !document.documentElement.contains(el) &&
                                ((_a = SimpleBar.instances.get(el)) === null || _a === void 0 ? void 0 : _a.unMount());
                        });
                    }
                }
            });
        });
    };
    SimpleBar.instances = new WeakMap();
    return SimpleBar;
}(SimpleBarCore));
/**
 * HTML API
 * Called only in a browser env.
 */
if (canUseDOM) {
    SimpleBar.initHtmlApi();
}

// Scrollbar
/*
	SimpleBar
	https://github.com/Grsmto/simplebar
*/

/*
	@param  {Element} scrollbarSelectors - HTML scrollbar elements
*/


function initScrollbar(rootEl) {
    let containerEl = rootEl && rootEl instanceof Node ? rootEl : document;

    const scrollbars = containerEl.querySelectorAll('.js-scrollbar');

    if (scrollbars?.length) {
        const setScrollbar = (scrollbarEl) => {
           if (scrollbarEl.getAttribute('data-simplebar') !== 'init') {
               const simpleBar = new SimpleBar(scrollbarEl, {
                   autoHide: false
               });
               let simpleBarWrapper;
               let simpleBarContent;

               simpleBar.getScrollElement().addEventListener('scroll', (event) => {
                   simpleBarWrapper = event.srcElement;
                   simpleBarContent = simpleBarWrapper.querySelector('.simplebar-content');
                   simpleBarContent.offsetHeight;
                   simpleBarWrapper.scrollTop;

                   // if ((simpleBarWrapper.offsetHeight + scrollTop + 15) >= heightContent) {
                   // 	event.path[4].setAttribute('data-simplebar-scrolled', '');
                   // } else {
                   // 	event.path[4].removeAttribute('data-simplebar-scrolled');
                   // }
               });
           }
       };

       const setScrollbars = () => {
           scrollbars.forEach((el) => {
               setScrollbar(el);
           });
       };

       setScrollbars();
    }

}

// import SimpleBar from 'simplebar';

/*
	  -------------
	|   DROPDOWN   |
	  -------------

	* Basic Selectors:
		* .js-dropdown - dropdown menu wrapper
		* .js-dropdown-button - popup open/close button
		* .js-dropdown-button-text - button text for opening/closing the popup window
		* .js-dropdown-popup - pop-up window
		* .js-dropdown-list - list of dropdown options
		* .js-dropdown-scroll - scroll of dropdown options
		* .js-dropdown-option - list option
		* .js-dropdown-input - Input when selected from dropdown list
*/

/**
	* @param {Element} dropdownContainer - HTML container element, default document
	* @param {Number} duration - Duration of opening and closing dropdown list
    (also needs to be changed in CSS)
*/

function initDropdown(dropdownContainer, duration = 300) {
	let dropdowns;

	{
		dropdowns = document.querySelectorAll('.js-dropdown');
	}

    let isOpeningDropdown = true;

    /**
        * Get active html dropdown element
    */
    const getActiveDropdown = () => {
        return document.querySelector('.js-dropdown.is-active');
    };

    /**
        * The offset of the dropdown list if it extends to the right beyond
        * the window's visibility with
    */
    const calcOffsetDropdown = () => {
        if (getActiveDropdown()) {
            const dropdownActivePopup = getActiveDropdown().querySelector('.js-dropdown-popup');

            if (dropdownActivePopup) {
                dropdownActivePopup.style.removeProperty('margin-left');

                const getBoundingClientRect = dropdownActivePopup.getBoundingClientRect();
                const offsetLeft = getBoundingClientRect.x;
                const width = getBoundingClientRect.width;
                const scrollbarCompensate = window.innerWidth - document.body.offsetWidth;

                if ((offsetLeft + width + 10) > window.innerWidth - scrollbarCompensate) {


                    dropdownActivePopup.style.marginLeft = (offsetLeft + width + 10 - window.innerWidth + scrollbarCompensate) * (-1) + 'px';
                } else {
                    dropdownActivePopup.style.removeProperty('margin-left');
                }
            }
        }
    };

    /**
        * Get focused option
        * @param  {Element} dropdownEl - dropdown html element
    */
    const getFocusedOption = (dropdownEl) => {
        return dropdownEl.querySelector(`.js-dropdown-option.is-focused`);
    };

    /**
        * Close active dropdown list
    */
    const closeDropdownActive = (event) => {
        if (getActiveDropdown() && isOpeningDropdown) {
            isOpeningDropdown = false;

            const dropdownPopup = getActiveDropdown().querySelector('.js-dropdown-popup');
            const dropdownButton = getActiveDropdown().querySelector('.js-dropdown-button');

            if (getFocusedOption(getActiveDropdown())) {
                getFocusedOption(getActiveDropdown()).classList.remove('is-focused');
            }

            if (dropdownButton && getActiveDropdown()
            && getActiveDropdown().getAttribute('data-dropdown') === 'select') {
                dropdownButton.focus();
                event.preventDefault();
            }

            getActiveDropdown().classList.remove('is-active');

            if (dropdownPopup) {
                dropdownPopup.setAttribute('aria-hidden', true);
            }

            setTimeout(() => {
                isOpeningDropdown = true;
            }, duration);
        }
    };

    /**
        * Dropdown initialization
        * @param  {Element} dropdownEl - dropdown html element
    */
    const setDropdown = (dropdownEl) => {
        const dropdownType = dropdownEl.getAttribute('data-dropdown');
        const dropdownPopup = dropdownEl.querySelector('.js-dropdown-popup');
        const dropdownScroll = dropdownEl.querySelector('.js-dropdown-scroll');
        const dropdownList = dropdownEl.querySelector('.js-dropdown-list');
        const dropdownOptions = dropdownEl.querySelectorAll('.js-dropdown-option');
        const dropdownCheckboxes = dropdownEl.querySelectorAll('.js-dropdown-checkbox');
        const dropdownInput = dropdownEl.querySelector('.js-dropdown-input');
        const dropdownPlaceholder = dropdownEl.getAttribute('data-placeholder');
        const dropdownButton = dropdownEl.querySelector('.js-dropdown-button');
        const dropdownButtonText = dropdownEl.querySelector('.js-dropdown-button-text');
        const selectedCheckboxesEl = dropdownEl.querySelector('.js-dropdown-selected-checkboxes');
        const optionsCount = dropdownOptions.length;
        const dropdownId = Date.now();
        let optionFocusedIndex = -1;

        /**
            * Get selected option
        */
        const getSelectedOption = () => {
            return dropdownEl.querySelector(
                `.js-dropdown-option.is-selected`) || false;
        };

        /**
            * Update the state of a focused option
            * @param  {Number} newIndex - Focused option index
        */
        const updateFocusedOption = (newIndex, isKeyboard) => {
            const prevOption = dropdownOptions[optionFocusedIndex];
            const option = dropdownOptions[newIndex];

            if (prevOption) {
                prevOption.classList.remove('is-focused');
                prevOption.setAttribute('aria-selected', false);
            }
            if (option) {
                if (isKeyboard) {
                    option.classList.add('is-focused');
                    option.focus();
                }
                option.setAttribute('aria-selected', true);

                if (dropdownList) {
                    dropdownList.setAttribute('aria-activedescendant', option.id);
                }
            }

            optionFocusedIndex = newIndex;
        };

        /**
            * Set scroll to see focused option
        */
        const setScrollTop = (optionSelected) => {
            const focusedOption = getFocusedOption(dropdownEl) || dropdownEl.querySelector('.js-dropdown-option.is-selected');

            if (dropdownScroll) {
                const dropdownScrollContent = dropdownScroll.querySelector('.simplebar-content-wrapper');

                if (dropdownScrollContent) {
                    dropdownScrollContent.scroll(0, 0);

                    if (focusedOption) {
                        const dropdownScrollHeight = dropdownScrollContent.clientHeight;
                        const { height } = focusedOption.getBoundingClientRect();
                        const offsetTop = focusedOption.offsetTop;

                        if ((offsetTop + height - dropdownScrollContent.scrollTop) > dropdownScrollHeight) {
                            dropdownScrollContent.scroll(0, offsetTop + height - dropdownScrollHeight);
                        }

                        if ((offsetTop - dropdownScrollContent.scrollTop) < 0) {
                            dropdownScrollContent.scroll(0, offsetTop);
                        }
                    }
                }
            }
        };

        /**
            * Open dropdown list
        */
        const openDropdown = () => {
            if (isOpeningDropdown) {
                isOpeningDropdown = false;

                if (getActiveDropdown() && getActiveDropdown() !== dropdownEl) {
                    getActiveDropdown().classList.remove('is-active');
                    dropdownEl.classList.add('is-active');
                } else {
                    dropdownEl.classList.toggle('is-active');
                }

                if (dropdownEl.classList.contains('is-active')) {
                    if (dropdownInput && dropdownInput.hasAttribute('data-datepicker-input')) {
                        dropdownInput.focus();
                    }

                    dropdownPopup.setAttribute('aria-hidden', false);

                    if (dropdownList) {
                        setTimeout(() => {
                            dropdownList.focus();
                        }, duration);
                    }

                    if (dropdownType === 'select') {
                        setScrollTop();
                    }

                    if (dropdownButton) {
                        dropdownButton.setAttribute('aria-expanded', true);
                    }
                } else {
                    dropdownPopup.setAttribute('aria-hidden', true);

                    if (dropdownButton) {
                        dropdownButton.setAttribute('aria-expanded', false);
                    }
                }

                if (dropdownInput && dropdownType === 'select') {
                    const optionSelectedIndex = getSelectedOption() ?
                    [].indexOf.call(dropdownOptions, getSelectedOption()) : -1;

                    updateFocusedOption(optionSelectedIndex);
                }

                calcOffsetDropdown();

                setTimeout(() => {
                    isOpeningDropdown = true;
                }, duration);
            }
        };

        /**
            * Check selected checkboxes width
        */
        const checkSelectedCheckboxesWidth = () => {
            if (selectedCheckboxesEl) {
                if (selectedCheckboxesEl.offsetWidth > dropdownButton.offsetWidth) {
                    return true;
                }

                return false;
            }
        };

        /**
            * Select checkboxes
        */
        const selectCheckboxes = () => {
            if (selectedCheckboxesEl && !dropdownEl.classList.contains('is-placeholder')) {
                let isSelected = false;
                let moreCount = 0;
                let isAddCount = false;
                selectedCheckboxesEl.innerHTML = '';

                for (let i = 0; i < dropdownCheckboxes.length; i += 1) {
                    const checkbox = dropdownCheckboxes[i];

                    if (checkbox.checked == true) {
                        const valueText = checkbox.getAttribute('data-text-value');
                        let selectedItem = document.createElement('span');

                        selectedItem.classList.add('ui-dropdown__selected-checkbox');
                        selectedItem.classList.add('js-dropdown-selected-checkbox');
                        selectedItem.innerHTML = valueText;

                        isSelected = true;

                        if (moreCount <= 0) {
                            selectedCheckboxesEl.append(selectedItem);
                        }

                        if (checkSelectedCheckboxesWidth()) {
                            selectedItem.remove();
                            isAddCount = true;
                        }

                        if (isAddCount) {
                            moreCount += 1;
                        }

                        selectedItem.addEventListener('click', (e) => {
                            e.preventDefault();

                            if (!selectedItem.previousElementSibling && !selectedItem.nextElementSibling) {
                                dropdownEl.classList.add('is-placeholder');
                            }

                            selectedItem.remove();

                            setTimeout(() => {
                                checkbox.checked = false;
                                selectCheckboxes();
                            }, 1);
                        });
                    }
                }

                if (!isSelected) {
                    dropdownEl.classList.add('is-placeholder');
                }

                if (dropdownButton) {
                    let moreCountEl;
                    moreCountEl = dropdownButton.querySelector('.js-dropdown-more-count');

                    if (moreCountEl) {
                        moreCountEl.remove();
                    }

                    if (moreCount > 0) {
                        moreCountEl = document.createElement('span');

                        moreCountEl.classList.add('ui-dropdown__selected-count');
                        moreCountEl.classList.add('js-dropdown-more-count');
                        moreCountEl.innerHTML = `+${moreCount}`;

                        dropdownButton.append(moreCountEl);
                    }
                }
            }
        };

        /**
            * Change dropdown
            * @param  {Element} dropdownOption - HTML option element
            * @param  {Boolean} isChangeEvent - Whether to trigger an input change event
        */
        const changeDropdown = (dropdownOption, isChangeEvent) => {
            if (isOpeningDropdown || dropdownType === 'multiple') {
                isOpeningDropdown = false;

                const dropdownOptionSelected = dropdownEl.querySelector('.js-dropdown-option.is-selected');
                const value = dropdownOption.getAttribute('data-value');
                const valueText = dropdownOption.getAttribute('data-text-value');
                const eventChange = new Event('change');
                const validateForm = dropdownOption.closest('.js-form-validation');

                if (dropdownOptionSelected) {
                    dropdownOptionSelected.classList.remove('is-selected');
                    dropdownOptionSelected.setAttribute('aria-selected', 'false');
                }

                if (dropdownType !== 'multiple') {
                    dropdownEl.classList.remove('is-active');
                }

                dropdownEl.classList.remove('is-placeholder');
                dropdownEl.classList.add('is-selected');

                if (dropdownType === 'select') {
                    dropdownOption.classList.add('is-selected');
                    dropdownOption.setAttribute('aria-selected', 'true');

                    if (dropdownList) {
                        dropdownList.setAttribute('aria-activedescendant', dropdownOption.id);
                    }
                }

                if (dropdownButtonText && (dropdownType === 'select' || dropdownType === 'menu')) {
                    dropdownButtonText.textContent = valueText ? valueText : value ? value : '';
                }

                if (dropdownButton) {
                    dropdownButton.setAttribute('aria-expanded', false);
                }

                if (dropdownInput) {
                    dropdownInput.value = value;
                    dropdownInput.classList.remove('is-error');

                    if (isChangeEvent) {
                        dropdownInput.dispatchEvent(eventChange);

                        if (validateForm
                            && validateForm.validate
                            && dropdownInput.classList.contains('js-validate-field')
                        ) {
                            validateForm.validate.revalidateField(dropdownInput);
                        }

                    }
                }

                if (dropdownType === 'multiple') {
                    selectCheckboxes();
                }

                setTimeout(() => {
                    isOpeningDropdown = true;

                    if (dropdownPopup) {
                        dropdownPopup.setAttribute('aria-hidden', true);
                    }
                }, duration);
            }
        };

        /**
            * Reset dropdown
        */
        const resetDropdown = () => {
            const dropdownOptionSelected = dropdownEl.querySelector('.js-dropdown-option.is-selected');

            if (dropdownInput) {
                dropdownInput.value = '';
            }

            if (dropdownOptionSelected) {
                dropdownOptionSelected.classList.remove('is-selected');
                dropdownOptionSelected.setAttribute('aria-selected', 'false');
            }

            dropdownEl.classList.remove('is-selected');
            dropdownEl.classList.add('is-placeholder');

            if (dropdownPlaceholder) {
                dropdownEl.setAttribute('data-placeholder', dropdownPlaceholder);

                if (dropdownButtonText) {
                    dropdownButtonText.innerHTML = dropdownPlaceholder;
                }
            }

        };

        // if (dropdownScroll) {
        //     new SimpleBar(dropdownScroll, {
        //         autoHide: false
        //     });
        // }

        dropdownEl.setAttribute('data-dropdown-init', '');

        if (dropdownButtonText) {
            dropdownButtonText.id = `dropdown-button-text-${dropdownId}`;
        }

        if (dropdownButton) {
            if (dropdownType === 'select') {
                dropdownButton.setAttribute('aria-labelledby', dropdownButtonText.id);
                dropdownButton.id = `dropdown-button-${dropdownId}`;
            }

            dropdownButton.addEventListener('click', (e) => {
                if (!e.target.classList.contains('js-dropdown-selected-checkbox')
                    && !e.target.closest('.js-dropdown-selected-checkbox')
                ) {
                    openDropdown();
                }
            });
        }

        if (dropdownPopup) {
            dropdownPopup.addEventListener('blur', () => {
                closeDropdownActive();
            });
        }

        dropdownOptions.forEach((option, index) => {
            option.id = `dropdown-option-${dropdownId}-${index + 1}`;

            option.addEventListener('click', () => {
                changeDropdown(option, true);
                // updateFocusedOption(index);
            });

            // option.addEventListener('mouseenter', () => {
            // 	updateFocusedOption(-1);
            // });

            // option.addEventListener('mouseleave', () => {
            // 	updateFocusedOption(index);
            // });
        });

        dropdownCheckboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', () => {
                changeDropdown(checkbox, true);

                // updateFocusedOption(index);
            });
        });

        if (dropdownInput && dropdownType === 'select') {
            const optionSelectedIndex = getSelectedOption() ?
            [].indexOf.call(dropdownOptions, getSelectedOption()) : -1;

            dropdownInput.addEventListener('change', (event) => {
                const optionCurrent = dropdownEl.querySelector(`.js-dropdown-option[data-value="${event.target.value}"]`);

                if (optionCurrent) {
                    changeDropdown(optionCurrent);
                }
            });

            updateFocusedOption(optionSelectedIndex);
        }

        dropdownEl.resetDropdown = () => {
            resetDropdown();
        };

        dropdownEl.addEventListener('keyup', (e) => {
            // press enter or space
            if ((e.key === 'Enter' || e.code === 'Enter' || e.code === 'Space')) {
                // -> open dropdown
                if (document.activeElement === dropdownButton) {
                    openDropdown();
                }

                if (document.activeElement.closest('.js-dropdown-list')) {
                    if (dropdownEl.classList.contains('is-active')) {
                        if (getFocusedOption(dropdownEl)) {
                            changeDropdown(getFocusedOption(dropdownEl));
                        } else {
                            closeDropdownActive();
                        }

                        if (dropdownButton) {
                            dropdownButton.focus();
                        }
                    }
                }
            }
        });

        dropdownEl.addEventListener('keydown', (e) => {
            if ((e.key === 'ArrowDown' || e.code === 'ArrowDown')) {

                if (optionFocusedIndex < optionsCount - 1) {
                    updateFocusedOption(optionFocusedIndex + 1, true);
                } else {
                    updateFocusedOption(0, true);
                }

                setScrollTop();
                e.preventDefault();
            }

            // press up -> go previous
            if ((e.key === 'ArrowUp' || e.code === 'ArrowUp')) {

                if (optionFocusedIndex > 0) {
                    updateFocusedOption(optionFocusedIndex - 1, true);
                } else {
                    updateFocusedOption(optionsCount - 1, true);
                }

                setScrollTop();
                e.preventDefault();
            }

            // press tab
            if (e.code === 'Tab' || e.key === 'Tab') {
                if (dropdownType === 'select'
                    && document.activeElement.closest('.js-dropdown.is-active')) {
                    closeDropdownActive(e);
                }

                if (dropdownType === 'menu' || dropdownType === 'multiple'
                    && !document.activeElement.closest('.js-dropdown.is-active')) {
                    closeDropdownActive(e);
                }
            }

            if (e.key === 'Escape' || e.code === 'Escape') {
                closeDropdownActive(e);
            }
        });

        window.addEventListener('resize', () => {
            selectCheckboxes();
        });
    };

    dropdowns.forEach((dropdownEl, index) => {
        if (!dropdownEl.hasAttribute('data-dropdown-init')) {
            setDropdown(dropdownEl);
        }
    });

    document.addEventListener('click', (event) => {
        const { target } = event;

        if (!target.classList.contains('js-dropdown')
        && !target.closest('.js-dropdown')
        && !target.classList.contains('js-dropdown-selected-checkbox')
        && !target.closest('.js-dropdown-selected-checkbox')) {
            closeDropdownActive(event);
        }
    });

    document.addEventListener('keyup', (event) => {
        if ((event.code === 'Tab' || event.key === 'Tab')
            && getActiveDropdown()
            && !document.activeElement.closest('.js-dropdown.is-active')) {
            closeDropdownActive(event);
        }
    });

    window.closeDropdown = () => {
        closeDropdownActive();
    };

    window.addEventListener('resize', (event) => {
        calcOffsetDropdown();
    });

    window.updateDropdowns = (container) => {
        const containerEl = container && container instanceof Node ? container : document;

        dropdowns = containerEl.querySelectorAll('.js-dropdown');

        dropdowns.forEach((dropdownEl, index) => {
            if (!dropdownEl.hasAttribute('data-dropdown-init')) {
                setDropdown(dropdownEl);
            }
        });
    };
}

/*
	  --------
	|   MODAL  |
	  --------

	* Basic Classes and attributes:
		* data-modal-open - attribute for opening a modal window, the value specifies the modal window selector
		* .js-modal - modal window
		* .js-modal-window - visible part of the modal window
		* .js-modal-close - attribute to close the modal window

	* Modal window initialization
		modal.init()

	* Callback functions when opening and closing a modal window
		modal.beforeOpen(callback) - Callback function before opening modal window
		modal.afterOpen(callback) - Callback function after opening modal window
		modal.beforeClose(callback) - Callback function before modal closes
		modal.afterClose(callback) - Callback function after closing the modal window
*/

const html = document.documentElement;
const body = document.querySelector('body');
const timeout = 300;
let modalSelectorOpen = null;
let modal = {};
let unlock = true;
let isOpen = false;
let mouseDownInsideModal = false;

const focusElements = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'iframe',
	'object',
	'embed',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])'
];

const bodyLock = () => {
	const scrollbarCompensate = `${window.innerWidth - document.body.offsetWidth}px`;
	html.style.setProperty('--modal-scrollbar-width', scrollbarCompensate);
	body.classList.add('modal-open');

	unlock = false;
	setTimeout(() => {
		unlock = true;
	}, timeout);
};

const bodyUnlock = () => {
	unlock = false;

	setTimeout(() => {
		html.style.removeProperty('--modal-scrollbar-width');
		body.classList.remove('modal-open');

		unlock = true;
	}, timeout);
};

const openModal = (currentModal, isDoubleModal = false) => {
	if (currentModal && !isOpen && unlock || isDoubleModal) {
		currentModal.querySelector('.js-modal-window');
		const modalContent = currentModal.querySelector('.js-modal-content');

		if (!isDoubleModal) {
			modal.beforeOpen();
		}

        if (modalSelectorOpen) {
            const modalDataContent = modalSelectorOpen.getAttribute('data-modal-content');

            if (modalDataContent && modalContent) {
                modalContent.innerHTML = modalDataContent;
            }
        }

		currentModal.setAttribute('aria-hidden', false);
		currentModal.classList.add('is-visible');

		setTimeout(() => {
			currentModal.classList.add('is-active');
		}, 10);

		isOpen = true;

		if (!isDoubleModal) {
			bodyLock();

			setTimeout(() => {
				modal.afterOpen();

			}, timeout);
		}

		setTimeout(() => {

		}, timeout);
	}
};

const closeModal = (activeModal, isDoubleModal = false) => {
	if (isOpen && unlock && activeModal) {
        const scrollContent = activeModal.querySelector('.simplebar-content-wrapper');
		modal.beforeClose();

		activeModal.setAttribute('aria-hidden', true);
		activeModal.classList.remove('is-active');

		if (!isDoubleModal) {
			bodyUnlock();
		}

		setTimeout(() => {
			activeModal.scrollTop = 0;
			activeModal.querySelector('.js-modal-window').scrollTop = 0;

            if (scrollContent) {
                scrollContent.scroll(0, 0);
            }

			activeModal.classList.remove('is-visible');

			if (!isDoubleModal) {
				isOpen = false;

				if (modalSelectorOpen) {
					modalSelectorOpen.focus();
				}

				modal.afterClose();
			}


		}, timeout);
	}
};

const callback = (callbackCurrent) => {
	if (callbackCurrent && typeof callbackCurrent === 'function') {
		callbackCurrent();
	}
};

const focusCatcher = (e, modal) => {
    // Находим все элементы на которые можно сфокусироваться
    const nodes = modal.querySelectorAll(focusElements);

    //преобразуем в массив
    const nodesArray = Array.prototype.slice.call(nodes);

    //если фокуса нет в окне, то вставляем фокус на первый элемент
    if (!modal.contains(document.activeElement)) {
        nodesArray[0].focus();
        e.preventDefault();
    } else {
        const focusedItemIndex = nodesArray.indexOf(document.activeElement);

        if (e.shiftKey && focusedItemIndex === 0) {
            //перенос фокуса на последний элемент
            nodesArray[nodesArray.length - 1].focus();
            e.preventDefault();
        }

        if (!e.shiftKey && focusedItemIndex === nodesArray.length - 1) {
            //перенос фокуса на первый элемент
            nodesArray[0].focus();
            e.preventDefault();
        }
    }
};

modal.beforeOpen = (callbackCurrent) => {
	callback(callbackCurrent);
};
modal.beforeClose = (callbackCurrent) => {
	callback(callbackCurrent);
};
modal.afterOpen = (callbackCurrent) => {
	callback(callbackCurrent);
};
modal.afterClose = (callbackCurrent) => {
	callback(callbackCurrent);
};

modal.init = () => {
	document.addEventListener('click', (e) => {
		const target = e.target;

		if (target.closest('[data-modal-open]') || target.hasAttribute('data-modal-open')) {
			const modalSelector = target.getAttribute('data-modal-open') || target.closest('[data-modal-open]').getAttribute('data-modal-open');
			const currentModal = modalSelector ? document.querySelector(modalSelector) : '';
			e.preventDefault();

			if (isOpen) {
				const activeModal = document.querySelector('.js-modal.is-active');

				if (activeModal !== currentModal && currentModal) {
					closeModal(activeModal, true);
					openModal(currentModal, true);
				}
			} else {
				modalSelectorOpen = target.hasAttribute('data-modal-open') ? target :
				target.closest('[data-modal-open]');

				openModal(currentModal);
			}
		} else if (isOpen && (target.closest('.js-modal-close') || target.classList.contains('js-modal-close') ||
			 target.classList.contains('js-modal-wrap') && !mouseDownInsideModal)
		) {
			const currentModal = target.classList.contains('js-modal') ? target : target.closest('.js-modal') || '';
			e.preventDefault();

			closeModal(currentModal);
		}
	});

	document.addEventListener('keydown', (e) => {
		const modalActive = document.querySelector('.js-modal.is-active');

		if ((e.code === 'Escape' || e.key === 'Escape') && isOpen) {
			closeModal(modalActive);
			return;
		}

		if ((e.code === 'Tab' || e.key === 'Tab') && isOpen && modalActive) {
			focusCatcher(e, modalActive);
			return;
		}
	});

    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('.js-modal-window')) {
            mouseDownInsideModal = true;
        } else {
            mouseDownInsideModal = false;
        }
    });
};

window.openModal = document.documentElement.openModal = modal.open = (selector, callbackCurrent) => {
	const currentModal = selector && typeof selector === 'string' ? document.querySelector(selector) : '';

    if (!currentModal) return;

    modalSelectorOpen = null;

	callback(callbackCurrent);

    if (isOpen) {
        const activeModal = document.querySelector('.js-modal.is-active');

        if (activeModal) {
            closeModal(activeModal, true);

			if (activeModal !== currentModal) {
				closeModal(activeModal, true);
				openModal(currentModal, true);
			}
        }
    } else {
        openModal(currentModal);
    }
};

window.closeModal = document.documentElement.closeModal = modal.close = (selector) => {
    const currentModal = selector && typeof selector === 'string' ? document.querySelector(selector) : '';

    if (!currentModal) return;

    closeModal(currentModal);
};

/*! License details at fancyapps.com/license */
const t$7=t=>"string"==typeof t;

/*! License details at fancyapps.com/license */
const n$9=n=>n&&null!==n&&n instanceof Element&&"nodeType"in n;

/*! License details at fancyapps.com/license */
const e$8=function(e){if(!(e&&e instanceof Element&&e.offsetParent))return  false;let n=false,i=false;if(e.scrollWidth>e.clientWidth){const i=window.getComputedStyle(e).overflowX,t=-1!==i.indexOf("hidden"),o=-1!==i.indexOf("clip"),d=-1!==i.indexOf("visible");n=!t&&!o&&!d;}if(e.scrollHeight>e.clientHeight){const n=window.getComputedStyle(e).overflowY,t=-1!==n.indexOf("hidden"),o=-1!==n.indexOf("clip"),d=-1!==n.indexOf("visible");i=!t&&!o&&!d;}return n||i},n$8=function(i,t=void 0){return !i||i===document.body||t&&i===t?null:e$8(i)?i:n$8(i.parentElement,t)};

/*! License details at fancyapps.com/license */
const e$7=function(e){var t=(new DOMParser).parseFromString(e,"text/html").body;if(t.childElementCount>1){for(var n=document.createElement("div");t.firstChild;)n.appendChild(t.firstChild);return n}let r=t.firstChild;return !r||r instanceof HTMLElement?r:((n=document.createElement("div")).appendChild(r),n)};

/*! License details at fancyapps.com/license */
const t$6=function(t=0,n=0,a=0){return Math.max(Math.min(n,a),t)};

/*! License details at fancyapps.com/license */
const t$5=t=>"object"==typeof t&&null!==t&&t.constructor===Object&&"[object Object]"===Object.prototype.toString.call(t);

/*! License details at fancyapps.com/license */
function e$6(e){return t$5(e)||Array.isArray(e)}function n$7(t,r){const o=Object.keys(t),c=Object.keys(r);return o.length===c.length&&o.every(o=>{const c=t[o],i=r[o];return "function"==typeof c?`${c}`==`${i}`:e$6(c)&&e$6(i)?n$7(c,i):c===i})}

/*! License details at fancyapps.com/license */
const e$5=function(n){for(const t of s$9)t.getState()===i$6.Running&&t.tick(a$5?n-a$5:0);a$5=n,u$4=window.requestAnimationFrame(e$5);};var i$6,o$7,r$5;!function(n){n[n.Initializing=0]="Initializing",n[n.Running=1]="Running",n[n.Paused=2]="Paused",n[n.Completed=3]="Completed",n[n.Destroyed=4]="Destroyed";}(i$6||(i$6={})),function(n){n[n.Spring=0]="Spring",n[n.Ease=1]="Ease";}(o$7||(o$7={})),function(n){n[n.Loop=0]="Loop",n[n.Reverse=1]="Reverse";}(r$5||(r$5={}));const s$9=new Set;let u$4=null,a$5=0;function c$4(){let a=i$6.Initializing,f=o$7.Ease,l=0,g=0,p=c$4.Easings.Linear,m=500,d=0,b=0,S=0,h=0,y=1/0,E=.01,R=.01,M=false,j={},w=null,v={},O={},C={},L=0,I=0,D=r$5.Loop,z=c$4.Easings.Linear;const N=new Map;function V(n,...t){for(const e of N.get(n)||[])e(...t);}function q(n){return g=0,n?w=setTimeout(()=>{x();},n):x(),F}function x(){a=i$6.Running,V("start",v,O);}function A(){if(a=i$6.Completed,C={},V("end",v),a===i$6.Completed)if(l<L){if(l++,D===r$5.Reverse){const n=Object.assign({},j);j=Object.assign({},O),O=n;}q(I);}else l=0;return F}const F={getState:function(){return a},easing:function(n){return p=n,f=o$7.Ease,C={},F},duration:function(n){return m=n,F},spring:function(n={}){f=o$7.Spring;const t={velocity:0,mass:1,tension:170,friction:26,restDelta:.1,restSpeed:.1,maxSpeed:1/0,clamp:true},{velocity:e,mass:i,tension:r,friction:s,restDelta:u,restSpeed:a,maxSpeed:c,clamp:l}=Object.assign(Object.assign({},t),n);return d=e,b=i,S=r,h=s,R=u,E=a,y=c,M=l,C={},F},isRunning:function(){return a===i$6.Running},isSpring:function(){return f===o$7.Spring},from:function(n){return v=Object.assign({},n),F},to:function(n){return O=n,F},repeat:function(n,t=0,e=r$5.Loop,i){return L=n,I=t,D=e,z=i||p,F},on:function(n,t){var e,i;return e=n,i=t,N.set(e,[...N.get(e)||[],i]),F},off:function(n,t){var e,i;return e=n,i=t,N.has(e)&&N.set(e,N.get(e).filter(n=>n!==i)),F},start:function(n){return n$7(v,O)||(a=i$6.Initializing,j=Object.assign({},v),s$9.add(this),u$4||(u$4=window.requestAnimationFrame(e$5)),q(n)),F},pause:function(){return w&&(clearTimeout(w),w=null),a===i$6.Running&&(a=i$6.Paused,V("pause",v)),F},end:A,tick:function(e){e>50&&(e=50),g+=e;let s=0,u=false;if(a!==i$6.Running)return F;if(f===o$7.Ease){s=t$6(0,g/m,1),u=1===s;const t=D===r$5.Reverse?z:p;for(const n in v)v[n]=j[n]+(O[n]-j[n])*t(s);}if(f===o$7.Spring){const t=.001*e;let i=0;for(const e in v){const o=O[e];let r=v[e];if("number"!=typeof o||isNaN(o)||"number"!=typeof r||isNaN(r))continue;if(Math.abs(o-r)<=R){v[e]=o,C[e]=0;continue}C[e]||("object"==typeof d&&"number"==typeof d[e]?C[e]=d[e]:C[e]="number"==typeof d?d:0);let s=C[e];s=t$6(-1*Math.abs(y),s,Math.abs(y));const u=s*b*h;s+=((r>o?-1:1)*(Math.abs(o-r)*S)-u)/b*t,r+=s*t;const a=v[e]>o?r<o:r>o;let c=Math.abs(s)<E&&Math.abs(o-r)<=R;M&&a&&(c=true),c?(r=o,s=0):i++,v[e]=r,C[e]=s;}u=!i;}const c=Object.assign({},O);return V("step",v,j,O,s),u&&a===i$6.Running&&n$7(O,c)&&(a=i$6.Completed,A()),F},getStartValues:function(){return j},getCurrentValues:function(){return v},getCurrentVelocities:function(){return C},getEndValues:function(){return O},destroy:function(){a=i$6.Destroyed,w&&(clearTimeout(w),w=null),j=v=O={},s$9.delete(this);}};return F}c$4.destroy=()=>{for(const n of s$9)n.destroy();u$4&&(cancelAnimationFrame(u$4),u$4=null);},c$4.Easings={Linear:function(n){return n},EaseIn:function(n){return 0===n?0:Math.pow(2,10*n-10)},EaseOut:function(n){return 1===n?1:1-Math.pow(2,-10*n)},EaseInOut:function(n){return 0===n?0:1===n?1:n<.5?Math.pow(2,20*n-10)/2:(2-Math.pow(2,-20*n+10))/2}};

/*! License details at fancyapps.com/license */
function e$4(e){return "undefined"!=typeof TouchEvent&&e instanceof TouchEvent}function t$4(t,n){const o=[],s=e$4(t)?t[n]:t instanceof MouseEvent&&("changedTouches"===n||"mouseup"!==t.type)?[t]:[];for(const e of s)o.push({x:e.clientX,y:e.clientY,ts:Date.now()});return o}function n$6(e){return t$4(e,"touches")}function o$6(e){return t$4(e,"targetTouches")}function s$8(e){return t$4(e,"changedTouches")}function i$5(e){const t=e[0],n=e[1]||t;return {x:(t.x+n.x)/2,y:(t.y+n.y)/2,ts:n.ts}}function r$4(e){const t=e[0],n=e[1]||e[0];return t&&n?-1*Math.sqrt((n.x-t.x)*(n.x-t.x)+(n.y-t.y)*(n.y-t.y)):0}const c$3=e=>{e.cancelable&&e.preventDefault();},a$4={passive:false},u$3={panThreshold:5,swipeThreshold:3,ignore:["textarea","input","select","[contenteditable]","[data-selectable]","[data-draggable]"]};let d$1=false,l$6=true;const f$1=(e,t)=>{let f,h,v,g,p,m=Object.assign(Object.assign({},u$3),t),E=[],w=[],y=[],T=false,b=false,M=false,L=false,x=0,P=0,D=0,X=0,Y=0,j=0,k=0,R=0,z=0,A=[];const O=new Map;function S(e){const t=r$4(w),n=r$4(y),o=t&&n?t/n:0,s=Math.abs(k)>Math.abs(R)?k:R,i={srcEvent:f,isPanRecognized:T,isSwipeRecognized:b,firstTouch:E,previousTouch:y,currentTouch:w,deltaX:D,deltaY:X,offsetX:Y,offsetY:j,velocityX:k,velocityY:R,velocity:s,angle:z,axis:v,scale:o,center:h};for(const t of O.get(e)||[])t(i);}function q(e){const t=e.target,n=e.composedPath()[0],o=m.ignore.join(","),s=e=>e&&e instanceof HTMLElement&&(e.matches(o)||e.closest(o));if(s(t)||s(n))return  false}function C(e){const t=Date.now();if(A=A.filter(e=>!e.ts||e.ts>t-100),e&&A.push(e),k=0,R=0,A.length>3){const e=A[0],t=A[A.length-1];if(e&&t){const n=t.x-e.x,o=t.y-e.y,s=e.ts&&t.ts?t.ts-e.ts:0;s>0&&(k=Math.abs(n)>3?n/(s/30):0,R=Math.abs(o)>3?o/(s/30):0);}}}function H(e){if(false===q(e))return;if("undefined"!=typeof MouseEvent&&e instanceof MouseEvent){if(d$1)return}else d$1=true;if("undefined"!=typeof MouseEvent&&e instanceof MouseEvent){if(!e.buttons||0!==e.button)return;c$3(e);}e instanceof MouseEvent&&(window.addEventListener("mousemove",I),window.addEventListener("mouseup",B)),window.addEventListener("blur",F),f=e,w=o$6(e),E=[...w],y=[],P=w.length,h=i$5(w),1===P&&(T=false,b=false,M=false),P&&C(i$5(w));const t=Date.now(),n=t-(x||t);L=n>0&&n<=250&&1===P,x=t,clearTimeout(g),S("start");}function I(e){var t;if(!E.length)return;if(e.defaultPrevented)return;if(false===q(e))return;f=e,y=[...w],w=n$6(e);const o=i$5(y),s=i$5(n$6(e));if(C(s),P=w.length,h=s,y.length===w.length?(D=s.x-o.x,X=s.y-o.y):(D=0,X=0),E.length){const e=i$5(E);Y=s.x-e.x,j=s.y-e.y;}if(w.length>1){const e=r$4(w),t=r$4(y);Math.abs(e-t)>=.1&&(M=true,S("pinch"));}T||(T=Math.abs(Y)>=m.panThreshold||Math.abs(j)>=m.panThreshold,T&&(l$6=false,clearTimeout(p),p=void 0,z=Math.abs(180*Math.atan2(j,Y)/Math.PI),v=z>45&&z<135?"y":"x",E=[...w],y=[...w],Y=0,j=0,D=0,X=0,null===(t=window.getSelection())||void 0===t||t.removeAllRanges(),S("panstart"))),T&&(D||X)&&S("pan"),S("move");}function B(e){if(f=e,!E.length)return;const t=o$6(e),n=s$8(e);if(P=t.length,h=i$5(n),n.length&&C(i$5(n)),y=[...w],w=[...t],E=[...t],P>0)S("end"),T=false,b=false,A=[];else {const e=m.swipeThreshold;(Math.abs(k)>e||Math.abs(R)>e)&&(b=true),T&&S("panend"),b&&S("swipe"),T||b||M||(S("tap"),L?S("doubleTap"):g=setTimeout(function(){S("singleTap");},250)),S("end"),G();}}function F(){clearTimeout(g),G(),T&&S("panend"),S("end");}function G(){d$1=false,T=false,b=false,L=false,P=0,A=[],w=[],y=[],E=[],D=0,X=0,Y=0,j=0,k=0,R=0,z=0,v=void 0,window.removeEventListener("mousemove",I),window.removeEventListener("mouseup",B),window.removeEventListener("blur",F),l$6||p||(p=setTimeout(()=>{l$6=true,p=void 0;},100));}function J(e){const t=e.target;d$1=false,t&&!e.defaultPrevented&&(l$6||(c$3(e),e.stopPropagation()));}const K={init:function(){return e&&(e.addEventListener("click",J,a$4),e.addEventListener("mousedown",H,a$4),e.addEventListener("touchstart",H,a$4),e.addEventListener("touchmove",I,a$4),e.addEventListener("touchend",B),e.addEventListener("touchcancel",B)),K},on:function(e,t){return function(e,t){O.set(e,[...O.get(e)||[],t]);}(e,t),K},off:function(e,t){return O.has(e)&&O.set(e,O.get(e).filter(e=>e!==t)),K},isPointerDown:()=>P>0,destroy:function(){clearTimeout(g),clearTimeout(p),p=void 0,e&&(e.removeEventListener("click",J,a$4),e.removeEventListener("mousedown",H,a$4),e.removeEventListener("touchstart",H,a$4),e.removeEventListener("touchmove",I,a$4),e.removeEventListener("touchend",B),e.removeEventListener("touchcancel",B)),e=null,G();}};return K};f$1.isClickAllowed=()=>l$6;

/*! License details at fancyapps.com/license */
const e$3={IMAGE_ERROR:"This image couldn't be loaded. <br /> Please try again later.",MOVE_UP:"Move up",MOVE_DOWN:"Move down",MOVE_LEFT:"Move left",MOVE_RIGHT:"Move right",ZOOM_IN:"Zoom in",ZOOM_OUT:"Zoom out",TOGGLE_FULL:"Toggle zoom level",TOGGLE_1TO1:"Toggle zoom level",ITERATE_ZOOM:"Toggle zoom level",ROTATE_CCW:"Rotate counterclockwise",ROTATE_CW:"Rotate clockwise",FLIP_X:"Flip horizontally",FLIP_Y:"Flip vertically",RESET:"Reset",TOGGLE_FS:"Toggle fullscreen"};

/*! License details at fancyapps.com/license */
const s$7=(s,t="")=>{s&&s.classList&&t.split(" ").forEach(t=>{t&&s.classList.add(t);});};

/*! License details at fancyapps.com/license */
const s$6=(s,t="")=>{s&&s.classList&&t.split(" ").forEach(t=>{t&&s.classList.remove(t);});};

/*! License details at fancyapps.com/license */
const s$5=(s,t="",c)=>{s&&s.classList&&t.split(" ").forEach(t=>{t&&s.classList.toggle(t,c||false);});};

/*! License details at fancyapps.com/license */
const h$2=e=>{e.cancelable&&e.preventDefault();},m$2=(e,t=1e4)=>(e=parseFloat(e+"")||0,Math.round((e+Number.EPSILON)*t)/t),p=e=>e instanceof HTMLImageElement;var v$2,b$1;!function(e){e.Reset="reset",e.Zoom="zoom",e.ZoomIn="zoomIn",e.ZoomOut="zoomOut",e.ZoomTo="zoomTo",e.ToggleCover="toggleCover",e.ToggleFull="toggleFull",e.ToggleMax="toggleMax",e.IterateZoom="iterateZoom",e.Pan="pan",e.Swipe="swipe",e.Move="move",e.MoveLeft="moveLeft",e.MoveRight="moveRight",e.MoveUp="moveUp",e.MoveDown="moveDown",e.RotateCCW="rotateCCW",e.RotateCW="rotateCW",e.FlipX="flipX",e.FlipY="flipY",e.ToggleFS="toggleFS";}(v$2||(v$2={})),function(e){e.Cover="cover",e.Full="full",e.Max="max";}(b$1||(b$1={}));const y$1={x:0,y:0,scale:1,angle:0,flipX:1,flipY:1},x$1={bounds:true,classes:{container:"f-panzoom",wrapper:"f-panzoom__wrapper",content:"f-panzoom__content",viewport:"f-panzoom__viewport"},clickAction:v$2.ToggleFull,dblClickAction:false,gestures:{},height:"auto",l10n:e$3,maxScale:4,minScale:1,mouseMoveFactor:1,panMode:"drag",protected:false,singleClickAction:false,spinnerTpl:'<div class="f-spinner"></div>',wheelAction:v$2.Zoom,width:"auto"};let w$1,M$2=0,j=0,E$1=0;const S=(c,b={},S={})=>{let k,O,T,A,C,F,Z,L,P=0,X=Object.assign(Object.assign({},x$1),b),Y={},R=Object.assign({},y$1),z=Object.assign({},y$1);const D=[];function I(e){let t=X[e];return t&&"function"==typeof t?t(Ee):t}function W(){return c&&c.parentElement&&k&&3===P}const $=new Map;function q(e,...t){const n=[...$.get(e)||[]];X.on&&n.push(X.on[e]);for(const e of n)e&&"function"==typeof e&&e(Ee,...t);"*"!==e&&q("*",e,...t);}function H(e){if(!W())return;const t=e.target;if(n$8(t))return;const o=Date.now(),s=[-e.deltaX||0,-e.deltaY||0,-e.detail||0].reduce(function(e,t){return Math.abs(t)>Math.abs(e)?t:e}),a=t$6(-1,s,1);q("wheel",e,a);const r=I("wheelAction");if(!r)return;if(e.defaultPrevented)return;const l=z.scale;let c=l*(a>0?1.5:.5);if(r===v$2.Zoom){const t=Math.abs(e.deltaY)<100&&Math.abs(e.deltaX)<100;if(o-j<(t?200:45))return void h$2(e);j=o;const n=ne(),s=se();if(m$2(c)<m$2(n)&&m$2(l)<=m$2(n)?(E$1+=Math.abs(a),c=n):m$2(c)>m$2(s)&&m$2(l)>=m$2(s)?(E$1+=Math.abs(a),c=s):(E$1=0,c=t$6(n,c,s)),E$1>7)return}switch(h$2(e),r){case v$2.Pan:ce(r,{srcEvent:e,deltaX:2*-e.deltaX,deltaY:2*-e.deltaY});break;case v$2.Zoom:ce(v$2.ZoomTo,{srcEvent:e,scale:c,center:{x:e.clientX,y:e.clientY}});break;default:ce(r,{srcEvent:e});}}function _(e){var n,o;const i=e.composedPath()[0];if(!f$1.isClickAllowed())return;if(!n$9(i)||e.defaultPrevented)return;if(!(null==c?void 0:c.contains(i)))return;if(i.hasAttribute("disabled")||i.hasAttribute("aria-disabled")||i.hasAttribute("data-carousel-go-prev")||i.hasAttribute("data-carousel-go-next"))return;const s=i.closest("[data-panzoom-action]"),a=null===(n=null==s?void 0:s.dataset)||void 0===n?void 0:n.panzoomAction,r=(null===(o=null==s?void 0:s.dataset)||void 0===o?void 0:o.panzoomValue)||"";if(a){switch(h$2(e),a){case v$2.ZoomTo:case v$2.ZoomIn:case v$2.ZoomOut:ce(a,{scale:parseFloat(r||"")||void 0});break;case v$2.MoveLeft:case v$2.MoveRight:ce(a,{deltaX:parseFloat(r||"")||void 0});break;case v$2.MoveUp:case v$2.MoveDown:ce(a,{deltaY:parseFloat(r||"")||void 0});break;case v$2.ToggleFS:Me();break;default:ce(a);}return}if(!(null==k?void 0:k.contains(i)))return;const u={srcEvent:e};if(ce(I("clickAction"),u),I("dblClickAction")){const e=Date.now(),t=e-(M$2||e);M$2=e,t>0&&t<=250?(w$1&&(clearTimeout(w$1),w$1=void 0),ce(I("dblClickAction"),u)):w$1=setTimeout(()=>{ce(I("singleClickAction"),u);},250);}}function B(e){if(L=e,!W()||!Q())return;if(R.scale<=1||z.scale<=1)return;if(((null==k?void 0:k.dataset.animationName)||"").indexOf("zoom")>-1)return;const t=ee(z.scale);if(!t)return;const{x:n,y:o}=t;ce(v$2.Pan,{deltaX:n-z.x,deltaY:o-z.y});}function N(){var e;c&&(s$6(c,"is-loading"),null===(e=c.querySelector(".f-spinner"))||void 0===e||e.remove());}function V(){if(!c||!O)return;if(N(),p(O)&&(!O.complete||!O.naturalWidth))return P=2,null==k||k.classList.add("has-error"),void q("error");q("loaded");const{width:e,height:t}=J();p(O)&&(O.setAttribute("width",e+""),O.setAttribute("height",t+"")),k&&(s$6(k,"has-error"),p(O)&&(k.setAttribute("width",e+""),k.setAttribute("height",t+""),k.style.aspectRatio=`${e/t||""}`)),F=c$4().on("start",(e,t)=>{ void 0!==t.angle&&(t.angle=90*Math.round(t.angle/90)),void 0!==t.flipX&&(t.flipX=t.flipX>0?1:-1),void 0!==t.flipY&&(t.flipY=t.flipY>0?1:-1),z=Object.assign(Object.assign({},y$1),t),le(),q("animationStart");}).on("pause",e=>{z=Object.assign(Object.assign({},y$1),e);}).on("step",e=>{if(!W())return void(null==F||F.end());if(R=Object.assign(Object.assign({},y$1),e),Q()||!I("bounds")||ye()||z.scale>R.scale||z.scale<oe())return void ue();const t=ae(z.scale);let n=false,o=false,s=false,a=false;R.x<t.x[0]&&(n=true),R.x>t.x[1]&&(o=true),R.y<t.y[0]&&(a=true),R.y>t.y[1]&&(s=true);let r=false,l=false,c=false,u=false;z.x<t.x[0]&&(r=true),z.x>t.x[1]&&(l=true),z.y<t.y[0]&&(u=true),z.y>t.y[1]&&(c=true);let d=false;(o&&l||n&&r)&&(z.x=t$6(t.x[0],z.x,t.x[1]),d=true),(s&&c||a&&u)&&(z.y=t$6(t.y[0],z.y,t.y[1]),d=true),d&&F&&F.spring({tension:94,friction:17,maxSpeed:555*z.scale,restDelta:.1,restSpeed:.1,velocity:F.getCurrentVelocities()}).from(R).to(z).start(),ue();}).on("end",()=>{(null==C?void 0:C.isPointerDown())||re(),(null==F?void 0:F.isRunning())||(le(),q("animationEnd"));}),function(){const e=I("gestures");if(!e)return;if(!A||!O)return;let t=false;C=f$1(A,e).on("start",e=>{if(!I("gestures"))return;if(!F)return;if(!W()||Q())return;const n=e.srcEvent;(R.scale>1||be(R.angle)||e.currentTouch.length>1)&&(null==n||n.stopPropagation(),F.pause(),t=true),1===e.currentTouch.length&&q("touchStart");}).on("move",e=>{var n;t&&(1!==z.scale||be(z.angle)||e.currentTouch.length>1)&&(h$2(e.srcEvent),null===(n=e.srcEvent)||void 0===n||n.stopPropagation());}).on("pan",e=>{if(!t)return;const n=e.srcEvent;(1!==z.scale||be(z.angle)||e.currentTouch.length>1)&&(h$2(n),ce(v$2.Pan,e));}).on("swipe",e=>{t&&(z.scale>1||be(z.angle))&&ce(v$2.Swipe,e);}).on("tap",e=>{q("click",e);}).on("singleTap",e=>{q("singleClick",e);}).on("doubleTap",e=>{q("dblClick",e);}).on("pinch",e=>{t&&(e.scale>oe()?ce(v$2.ZoomIn,e):e.scale<oe()?ce(v$2.ZoomOut,e):ce(v$2.Pan,e));}).on("end",e=>{t&&(e.currentTouch.length?(e.srcEvent.stopPropagation(),h$2(e.srcEvent),null==F||F.end()):(t=false,le(),re(),q("touchEnd")));}).init();}(),A&&(A.addEventListener("wheel",H,{passive:false}),D.push(()=>{null==A||A.removeEventListener("wheel",H,{passive:false});})),null==c||c.addEventListener("click",_),null===document||void 0===document||document.addEventListener("mousemove",B),D.push(()=>{null==c||c.removeEventListener("click",_),null===document||void 0===document||document.removeEventListener("mousemove",B);});const n=U();R=Object.assign({},n),z=Object.assign({},n),P=3,ue(),le(),q("ready"),requestAnimationFrame(()=>{3===P&&(N(),A&&(A.style.visibility=""));});}function U(){const e=Object.assign({},I("startPos")||{});let t=e.scale,n=1;n="string"==typeof t?te(t):"number"==typeof t?t:oe();const o=Object.assign(Object.assign(Object.assign({},y$1),e),{scale:n}),i=Q()?ee(n):void 0;if(i){const{x:e,y:t}=i;o.x=e,o.y=t;}return o}function G(){const e={top:0,left:0,width:0,height:0};if(k){const t=k.getBoundingClientRect();be(z.angle)?(e.top=t.top+.5*t.height-.5*t.width,e.left=t.left+.5*t.width-.5*t.height,e.width=t.height,e.height=t.width):(e.top=t.top,e.left=t.left,e.width=t.width,e.height=t.height);}return e}function J(){let t=I("width"),n=I("height");if(O&&"auto"===t){const e=O.getAttribute("width");t=e?parseFloat(e+""):void 0!==O.dataset.width?parseFloat(O.dataset.width+""):p(A)?A.naturalWidth:p(O)?O.naturalWidth:(null==k?void 0:k.getBoundingClientRect().width)||0;}else t=t$7(t)?parseFloat(t):t;if(O&&"auto"===n){const e=O.getAttribute("height");n=e?parseFloat(e+""):void 0!==O.dataset.height?parseFloat(O.dataset.height+""):p(A)?A.naturalHeight:p(O)?O.naturalHeight:(null==k?void 0:k.getBoundingClientRect().height)||0;}else n=t$7(n)?parseFloat(n):n;return {width:t,height:n}}function K(){const e=G();return {width:e.width,height:e.height}}function Q(){return "mousemove"===I("panMode")&&matchMedia("(hover: hover)").matches}function ee(e){const t=L||I("event"),n=null==k?void 0:k.getBoundingClientRect();if(!t||!n||e<=1)return {x:0,y:0};const o=(t.clientX||0)-n.left,s=(t.clientY||0)-n.top,{width:a,height:r}=K(),l=ae(e);if(e>1){const t=I("mouseMoveFactor");t>1&&(e*=t);}let c=a*e,u=r*e,d=.5*(c-a)-o/a*100/100*(c-a),f=.5*(u-r)-s/r*100/100*(u-r);return d=t$6(l.x[0],d,l.x[1]),f=t$6(l.y[0],f,l.y[1]),{x:d,y:f}}function te(e){if(!e)return z.scale;if(!c)return 1;const t=c.getBoundingClientRect(),n=G(),{width:o,height:s}=J(),a=e=>{if("number"==typeof e)return e;switch(e){case "min":case "base":return 1;case "cover":return Math.max(t.height/n.height,t.width/n.width)||1;case "full":case "max":{const e=be(z.angle)?s:o;return e&&n.width?e/n.width:1}}},r=I("minScale"),l=I("maxScale"),u=Math.min(a("full"),a(r)),d="number"==typeof l?a("full")*l:Math.min(a("full"),a(l));switch(e){case "min":return u;case "base":return t$6(u,1,d);case "cover":return a("cover");case "full":return Math.min(d,a("full"));case "max":return d}}function ne(){return te("min")}function oe(){return te("base")}function ie(){return te("full")}function se(){return te("max")}function ae(e){const t={x:[0,0],y:[0,0]},n=null==c?void 0:c.getBoundingClientRect();if(!n)return t;const o=G(),i=n.width,s=n.height;let a=o.width,r=o.height,l=e=void 0===e?z.scale:e,u=e;if(Q()&&e>1){const t=I("mouseMoveFactor");t>1&&(a*e>i+.01&&(l*=t),r*e>s+.01&&(u*=t));}if(a*=l,r*=u,a>i){t.x[0]=.5*(i-a),t.x[1]=.5*(a-i);const e=.5*(o.left-n.left),s=.5*(o.left+o.width-n.right);t.x[0]-=e+s,t.x[1]-=e+s;}if(r>s){t.y[0]=.5*(s-r),t.y[1]=.5*(r-s);const e=.5*(o.top-n.top),i=.5*(o.top+o.height-n.bottom);t.y[0]-=e+i,t.y[1]-=e+i;}return t}function re(){if(!W())return;if(!I("bounds"))return;if(!F)return;const e=ne(),t=se(),n=t$6(e,z.scale,t);if(z.scale<e-.01||z.scale>t+.01)return void ce(v$2.ZoomTo,{scale:n});if(F.isRunning())return;if(ye())return;const o=ae(n);z.x<o.x[0]||z.x>o.x[1]||z.y<o.y[0]||z.y>o.y[1]?(z.x=t$6(o.x[0],z.x,o.x[1]),z.y=t$6(o.y[0],z.y,o.y[1]),F.spring({tension:170,friction:17,restDelta:.001,restSpeed:.001,maxSpeed:1/0,velocity:F.getCurrentVelocities()}),F.from(R).to(z).start()):ue();}function le(e){var t;if(!W())return;const n=ve(),o=ye(),i=xe(),s=we(),a=fe(),r=ge();s$5(k,"is-fullsize",s),s$5(k,"is-expanded",i),s$5(k,"is-dragging",o),s$5(k,"can-drag",n),s$5(k,"will-zoom-in",a),s$5(k,"will-zoom-out",r);const l=me(),u=pe(),d=he(),g=!W();for(const n of (null===(t=e||c)||void 0===t?void 0:t.querySelectorAll("[data-panzoom-action]"))||[]){const e=n.dataset.panzoomAction;let t=false;if(g)t=true;else switch(e){case v$2.ZoomIn:l||(t=true);break;case v$2.ZoomOut:d||(t=true);break;case v$2.ToggleFull:{u||d||(t=true);const e=n.querySelector("g");e&&(e.style.display=s&&!t?"none":"");break}case v$2.IterateZoom:{l||d||(t=true);const e=n.querySelector("g");e&&(e.style.display=l||t?"":"none");break}case v$2.ToggleCover:case v$2.ToggleMax:l||d||(t=true);}t?(n.setAttribute("aria-disabled",""),n.setAttribute("tabindex","-1")):(n.removeAttribute("aria-disabled"),n.removeAttribute("tabindex"));}}function ce(e,t){var n;if(!(e&&c&&O&&F&&W()))return;if(e===v$2.Swipe&&Math.abs(F.getCurrentVelocities().scale)>.01)return;const o=Object.assign({},z);let s=Object.assign({},z),l=ae(Q()?o.scale:R.scale);const u=F.getCurrentVelocities(),d=G(),f=((null===(n=(t=t||{}).currentTouch)||void 0===n?void 0:n.length)||0)>1,h=t.velocityX||0,m=t.velocityY||0;let p=t.center;t.srcEvent&&(p=i$5(s$8(t.srcEvent)));let b=t.deltaX||0,x=t.deltaY||0;switch(e){case v$2.MoveRight:b=t.deltaX||100;break;case v$2.MoveLeft:b=t.deltaX||-100;break;case v$2.MoveUp:x=t.deltaY||-100;break;case v$2.MoveDown:x=t.deltaY||100;}let w=[];if("number"==typeof e)s.scale=e;else switch(e){case v$2.Reset:s=Object.assign({},y$1),s.scale=oe();break;case v$2.ZoomTo:case v$2.ZoomIn:case v$2.ZoomOut:case v$2.ToggleCover:case v$2.ToggleFull:case v$2.ToggleMax:case v$2.IterateZoom:case v$2.Zoom:s.scale=de(e,t);break;case v$2.Pan:case v$2.Move:case v$2.MoveLeft:case v$2.MoveRight:case v$2.MoveUp:case v$2.MoveDown:if(ye()){let e=1,t=1;s.x<=l.x[0]&&h<=0&&(e=Math.max(.01,1-Math.abs(1/d.width*Math.abs(s.x-l.x[0]))),e*=.2),s.x>=l.x[1]&&h>=0&&(e=Math.max(.01,1-Math.abs(1/d.width*Math.abs(s.x-l.x[1]))),e*=.2),s.y<=l.y[0]&&m<=0&&(t=Math.max(.01,1-Math.abs(1/d.height*Math.abs(s.y-l.y[0]))),t*=.2),s.y>=l.y[1]&&m>=0&&(t=Math.max(.01,1-Math.abs(1/d.height*Math.abs(s.y-l.y[1]))),t*=.2),s.x+=b*e,s.y+=x*t;}else s.x=t$6(l.x[0],s.x+b,l.x[1]),s.y=t$6(l.y[0],s.y+x,l.y[1]);break;case v$2.Swipe:const n=(e=0)=>Math.sign(e)*Math.pow(Math.abs(e),1.5);s.x+=t$6(-1e3,n(h),1e3),s.y+=t$6(-1e3,n(m),1e3),m&&!h&&(s.x=t$6(l.x[0],s.x,l.x[1])),!m&&h&&(s.y=t$6(l.y[0],s.y,l.y[1])),u.x=h,u.y=m;break;case v$2.RotateCW:s.angle+=90;break;case v$2.RotateCCW:s.angle-=90;break;case v$2.FlipX:s.flipX*=-1;break;case v$2.FlipY:s.flipY*=-1;}if(void 0!==R.angle&&Math.abs(R.angle)>=360&&(s.angle-=360*Math.floor(R.angle/360),R.angle-=360*Math.floor(R.angle/360)),w.length){const e=w.findIndex(e=>e>s.scale+1e-4);s.scale=w[e]||w[0];}if(f&&(s.scale=t$6(ne()*(f?.8:1),s.scale,se()*(f?1.6:1))),Q()){const e=ee(s.scale);if(e){const{x:t,y:n}=e;s.x=t,s.y=n;}}else if(Math.abs(s.scale-o.scale)>1e-4){let e=0,t=0;if(p)e=p.x,t=p.y;else {const n=c.getBoundingClientRect();e=n.x+.5*n.width,t=n.y+.5*n.height;}let n=e-d.left,a=t-d.top;n-=.5*d.width,a-=.5*d.height;const r=(n-o.x)/o.scale,u=(a-o.y)/o.scale;s.x=n-r*s.scale,s.y=a-u*s.scale,!f&&I("bounds")&&(l=ae(s.scale),s.x=t$6(l.x[0],s.x,l.x[1]),s.y=t$6(l.y[0],s.y,l.y[1]));}if(e===v$2.Swipe){let e=94,t=17,n=500*s.scale,o=u;F.spring({tension:e,friction:t,maxSpeed:n,restDelta:.1,restSpeed:.1,velocity:o});}else e===v$2.Pan||f?F.spring({tension:900,friction:17,restDelta:.01,restSpeed:.01,maxSpeed:1}):F.spring({tension:170,friction:17,restDelta:.001,restSpeed:.001,maxSpeed:1/0,velocity:u});if(0===t.velocity||n$7(R,s))R=Object.assign({},s),z=Object.assign({},s),F.end(),ue(),le();else {if(n$7(z,s))return;F.from(R).to(s).start();}q("action",e);}function ue(){if(!O||!k||!A)return;const{width:e,height:t}=J();Object.assign(k.style,{maxWidth:`min(${e}px, 100%)`,maxHeight:`min(${t}px, 100%)`});const n=function(){const{width:e,height:t}=J(),{width:n,height:o}=K();if(!c)return {x:0,y:0,width:0,height:0,scale:0,flipX:0,flipY:0,angle:0,fitWidth:n,fitHeight:o,fullWidth:e,fullHeight:t};let{x:i,y:s,scale:a,angle:r,flipX:l,flipY:u}=R,d=1/ie(),f=e,g=t,h=R.scale*d,m=z.scale*d;const p=Math.max(n,o),v=Math.min(n,o);e>t?(f=p,g=v):(f=v,g=p);h=e>t?p*a/e||1:p*a/t||1;let b=f?e*m:0,y=g?t*m:0,x=f&&g?e*h/b:0;return i=i+.5*f-.5*b,s=s+.5*g-.5*y,{x:i,y:s,width:b,height:y,scale:x,flipX:l,flipY:u,angle:r,fitWidth:n,fitHeight:o,fullWidth:e,fullHeight:t}}(),{x:o,y:i,width:s,height:a,scale:r,angle:l,flipX:u,flipY:d}=n;let f=`translate(${m$2(o,100)}px, ${m$2(i,100)}px)`;f+=1!==u||1!==d?` scaleX(${m$2(r*u)}) scaleY(${m$2(r*d)})`:` scale(${m$2(r)})`,0!==l&&(f+=` rotate(${l}deg)`),A.style.width=`${m$2(s)}px`,A.style.height=`${m$2(a)}px`,A.style.transform=`${f}`,q("render");}function de(e=I("clickAction"),t={}){let n=z.scale,o=oe(),s=[];if("number"==typeof e)o=e;else if(e){switch(e){case v$2.ZoomTo:o=t.scale||1;break;case v$2.ZoomIn:o=n*(t.scale||2);break;case v$2.ZoomOut:o=n*(t.scale||.5);break;case v$2.ToggleCover:s=[oe(),te("cover")];break;case v$2.ToggleFull:s=[oe(),ie()];break;case v$2.ToggleMax:s=[oe(),se()];break;case v$2.IterateZoom:s=[oe(),ie(),se()];break;case v$2.Zoom:{const e=ie();o=n>=e-.05?oe():Math.min(e,n*(t.scale||2));break}}if(s.length){const e=s.find(e=>e>n+1e-4);o=null!=e?e:oe();}}return e!==v$2.ZoomTo&&(o=t$6(ne(),o,se())),o}function fe(){return !!(W()&&de()>z.scale)}function ge(){return !!(W()&&de()<z.scale)}function he(){return !!(W()&&z.scale>ne())}function me(){return !!(W()&&z.scale<se())}function pe(){return !!(W()&&z.scale<ie())}function ve(){return !(!W()||!xe()&&!be(z.angle)||!C||Q())}function be(e){return 90===Math.abs(e%180)}function ye(){return !(!W()||!(null==C?void 0:C.isPointerDown())||Q())}function xe(){return !!(W()&&z.scale>oe())}function we(){return !!(W()&&z.scale>=ie())}function Me(){const e="in-fullscreen",t="with-panzoom-in-fullscreen";null==c||c.classList.toggle(e);const n=null==c?void 0:c.classList.contains(e);n?(document.documentElement.classList.add(t),document.addEventListener("keydown",je,true)):(document.documentElement.classList.remove(t),document.removeEventListener("keydown",je,true)),ue(),q(n?"enterFS":"exitFS");}function je(e){"Escape"!==e.key||e.defaultPrevented||Me();}const Ee={canDrag:ve,canZoomIn:me,canZoomOut:he,canZoomToFull:pe,destroy:function(){q("destroy");for(const e of Object.values(Y))null==e||e.destroy(Ee);for(const e of D)e();return k&&(k.style.aspectRatio="",k.style.maxWidth="",k.style.maxHeight=""),A&&(A.style.width="",A.style.height="",A.style.transform=""),k=void 0,O=void 0,A=void 0,R=Object.assign({},y$1),z=Object.assign({},y$1),null==F||F.destroy(),F=void 0,null==C||C.destroy(),C=void 0,P=4,Ee},emit:q,execute:ce,getBoundaries:ae,getContainer:function(){return c},getContent:function(){return O},getFullDim:J,getGestures:function(){return C},getMousemovePos:ee,getOptions:function(){return X},getPlugins:function(){return Y},getScale:te,getStartPosition:U,getState:function(){return P},getTransform:function(e){return  true===e?z:R},getTween:function(){return F},getViewport:function(){return A},getWrapper:function(){return k},init:function(){return P=0,q("init"),function(){for(const[e,t]of Object.entries(Object.assign(Object.assign({},S),X.plugins||{})))if(e&&!Y[e]&&t instanceof Function){const n=t();n.init(Ee),Y[e]=n;}q("initPlugins");}(),function(){var e,t,n;const o=Object.assign(Object.assign({},x$1.classes),I("classes")),i=null===(e=o.content)||void 0===e?void 0:e.split(" ").shift(),s=null===(t=o.wrapper)||void 0===t?void 0:t.split(" ").shift(),a=null===(n=o.viewport)||void 0===n?void 0:n.split(" ").shift();if(!i||!s||!a)return;if(!c)return;if(s$7(c,o.container),O=c.querySelector(`.${i}:not(.is-clone)`),!O)return;O.setAttribute("draggable","false"),k=c.querySelector(`.${s}`),k||(k=document.createElement("div"),s$7(k,o.wrapper),O.insertAdjacentElement("beforebegin",k),k.insertAdjacentElement("afterbegin",O));A=c.querySelector(`.${a}`),A||(A=document.createElement("div"),s$7(A,o.viewport),k.insertAdjacentElement("beforeend",A));A.contains(O)||A.insertAdjacentElement("afterbegin",O);T=c.querySelector(`.${i}.is-clone`),T||(T=O.cloneNode(true),T.removeAttribute("id"),s$7(T,"is-clone"),k.insertAdjacentElement("afterbegin",T));O instanceof HTMLPictureElement&&(O=O.querySelector("img"));T instanceof HTMLPictureElement&&(T=T.querySelector("img"));A instanceof HTMLPictureElement&&(A=A.querySelector("img"));if(A&&(A.style.visibility="hidden",I("protected"))){A.addEventListener("contextmenu",e=>{h$2(e);});const e=document.createElement("div");s$7(e,"f-panzoom__protected"),A.appendChild(e);}q("initLayout");}(),function(){if(c&&k&&!Z){let e=null;Z=new ResizeObserver(()=>{W()&&(e=e||requestAnimationFrame(()=>{W()&&(le(),re(),q("refresh")),e=null;}));}),Z.observe(k),D.push(()=>{null==Z||Z.disconnect(),Z=void 0,e&&(cancelAnimationFrame(e),e=null);});}}(),function(){if(!c||!O)return;if(!p(O)||!p(T))return void V();const e=()=>{O&&p(O)&&O.decode().then(()=>{V();}).catch(()=>{V();});};if(P=1,c.classList.add("is-loading"),q("loading"),T.src&&T.complete)return void e();((function(){if(!c)return;if(null==c?void 0:c.querySelector(".f-spinner"))return;const e=I("spinnerTpl"),t=e$7(e);t&&(t.classList.add("f-spinner"),c.classList.add("is-loading"),null==k||k.insertAdjacentElement("afterbegin",t));}))(),T.addEventListener("load",e,false),T.addEventListener("error",e,false),D.push(()=>{null==T||T.removeEventListener("load",e,false),null==T||T.removeEventListener("error",e,false);});}(),Ee},isDragging:ye,isExpanded:xe,isFullsize:we,isMousemoveMode:Q,localize:function(e,t=[]){const n=I("l10n")||{};e=String(e).replace(/\{\{(\w+)\}\}/g,(e,t)=>n[t]||e);for(let n=0;n<t.length;n++)e=e.split(t[n][0]).join(t[n][1]);return e=e.replace(/\{\{(.*?)\}\}/g,(e,t)=>t)},off:function(e,t){for(const n of e instanceof Array?e:[e])$.has(n)&&$.set(n,$.get(n).filter(e=>e!==t));return Ee},on:function(e,t){for(const n of e instanceof Array?e:[e])$.set(n,[...$.get(n)||[],t]);return Ee},toggleFS:Me,updateControls:le,version:"6.1.14",willZoomIn:fe,willZoomOut:ge};return Ee};S.l10n={en_EN:e$3},S.getDefaults=()=>x$1;

/*! License details at fancyapps.com/license */
const e$2=(e,o)=>{let t=[];return e.childNodes.forEach(e=>{e.nodeType!==Node.ELEMENT_NODE||o&&!e.matches(o)||t.push(e);}),t};

/*! License details at fancyapps.com/license */
const r$3=(t,...e)=>{const n=e.length;for(let c=0;c<n;c++){const n=e[c]||{};Object.entries(n).forEach(([e,n])=>{const c=Array.isArray(n)?[]:{};t[e]||Object.assign(t,{[e]:c}),t$5(n)?Object.assign(t[e],r$3(t[e],n)):Array.isArray(n)?Object.assign(t,{[e]:[...n]}):Object.assign(t,{[e]:n});});}return t};

/*! License details at fancyapps.com/license */
const t$3=function(t=0,n=0,r=0,c=0,m=0,p=false){const s=(t-n)/(r-n)*(m-c)+c;return p?c<m?t$6(c,s,m):t$6(m,s,c):s};

/*! License details at fancyapps.com/license */
const o$5=Object.assign(Object.assign({},e$3),{ERROR:"Something went wrong. <br /> Please try again later.",NEXT:"Next page",PREV:"Previous page",GOTO:"Go to page #%d",DOWNLOAD:"Download",TOGGLE_FULLSCREEN:"Toggle full-screen mode",TOGGLE_EXPAND:"Toggle full-size mode",TOGGLE_THUMBS:"Toggle thumbnails",TOGGLE_AUTOPLAY:"Toggle slideshow"});

/*! License details at fancyapps.com/license */
const m$1=t=>{t.cancelable&&t.preventDefault();},h$1={adaptiveHeight:false,center:true,classes:{container:"f-carousel",isEnabled:"is-enabled",isLTR:"is-ltr",isRTL:"is-rtl",isHorizontal:"is-horizontal",isVertical:"is-vertical",hasAdaptiveHeight:"has-adaptive-height",viewport:"f-carousel__viewport",slide:"f-carousel__slide",isSelected:"is-selected"},dragFree:false,enabled:true,errorTpl:'<div class="f-html">{{ERROR}}</div>',fill:true,infinite:true,initialPage:0,l10n:o$5,rtl:false,slides:[],slidesPerPage:"auto",spinnerTpl:'<div class="f-spinner"></div>',transition:"fade",tween:{clamp:true,mass:1,tension:160,friction:25,restDelta:1,restSpeed:1,velocity:0},vertical:false};let b,y,E=0;const x=(g,M={},w={})=>{E++;let S,A,j,L,P,T=0,O=Object.assign({},h$1),R=Object.assign({},h$1),H={},V=null,C=null,$=0,D=0,I=0,q=false,k=false,F=false,z="height",B=0,N=true,_=0,G=0,X=0,Y=0,W="*",J=[],K=[];const Q=new Set;let U=[],Z=[],tt=0,et=0,nt=0;function it(t,...e){let n=R[t];return n&&n instanceof Function?n(Ft,...e):n}function ot(t,e=[]){const n=it("l10n")||{};t=String(t).replace(/\{\{(\w+)\}\}/g,(t,e)=>n[e]||t);for(let n=0;n<e.length;n++)t=t.split(e[n][0]).join(e[n][1]);return t=t.replace(/\{\{(.*?)\}\}/g,(t,e)=>e)}const st=new Map;function rt(t,...e){const n=[...st.get(t)||[]];R.on&&n.push(R.on[t]);for(const t of n)t&&t instanceof Function&&t(Ft,...e);"click"===t&&Ot(e[0]),"*"!==t&&rt("*",t,...e);}function lt(){var e,n;const i=r$3({},h$1,O);let r="";const l=O.breakpoints||{};for(const[t,e]of Object.entries(l))window.matchMedia(t).matches&&(r+=t,r$3(i,e));if(void 0===P||r!==P){if(P=r,0!==T){let t=null===(n=null===(e=Z[_])||void 0===e?void 0:e.slides[0])||void 0===n?void 0:n.index;void 0===t&&(t=R.initialSlide),i.initialSlide=t,i.slides=[];for(const t of J)t.isVirtual&&i.slides.push(t);}It(),R=i,false!==it("enabled")&&(T=0,rt("init"),function(){for(const[t,e]of Object.entries(Object.assign(Object.assign({},w),R.plugins||{})))if(t&&!H[t]&&e instanceof Function){const n=e();n.init(Ft,x),H[t]=n;}rt("initPlugins");}(),function(){if(!V)return;const e=it("classes")||{};s$7(V,e.container);const n=it("style");if(n&&t$5(n))for(const[t,e]of Object.entries(n))V.style.setProperty(t,e);C=Array.from(V.querySelectorAll(`.${e.viewport}`)).filter(t=>t.closest(`.${e.container}`)===V).pop()||null,C||(C=document.createElement("div"),s$7(C,e.viewport),C.append(...e$2(V,`.${e.slide}`)),V.insertAdjacentElement("afterbegin",C)),V.carousel=Ft,rt("initLayout");}(),function(){if(!C)return;const t=it("classes")||{};J=[],[...e$2(C,`.${t.slide}`)].forEach(t=>{if(t.parentElement){const e=Et(Object.assign({el:t,isVirtual:false},t.dataset||{}));rt("createSlide",e),J.push(e);}}),St();for(const t of J)rt("addSlide",t);yt(it("slides"));for(const t of J){const e=t.el;(null==e?void 0:e.parentElement)===C&&(s$7(e,R.classes.slide),s$7(e,t.class),Vt(t),rt("attachSlideEl",t));}rt("initSlides");}(),At(),T=1,s$7(V,(it("classes")||{}).isEnabled||""),Dt(),ft(),A=c$4().on("start",()=>{S&&S.isPointerDown()||(ut(),Dt());}).on("step",t=>{const e=B;B=t.pos,B!==e&&(N=false,Dt());}).on("end",t=>{(null==S?void 0:S.isPointerDown())||(B=t.pos,A&&!q&&(B<X||B>Y)?A.spring({clamp:true,mass:1,tension:200,friction:25,velocity:0,restDelta:1,restSpeed:1}).from({pos:B}).to({pos:t$6(X,B,Y)}).start():N||(N=true,rt("settle")));}),ct(),function(){if(!V||!C)return;V.addEventListener("click",Tt),document.addEventListener("mousemove",at),y||(y=function(t){var e,n;const i=null===(n=null===(e=t.target)||void 0===e?void 0:e.dataset)||void 0===n?void 0:n.carouselTarget;if(i){const e=document.getElementById(`${i.split("#").pop()}`),n=null==e?void 0:e.carousel;null==n||n.emit("click",t);}},document.addEventListener("click",y));const t=C.getBoundingClientRect();if(tt=t.height,et=t.width,!j){let t=null;j=new ResizeObserver(()=>{t||(t=requestAnimationFrame(()=>{!function(){if(1!==T||!C)return;const t=Z.length,e=C.getBoundingClientRect(),n=e.height,i=e.width;t>1&&(F&&Math.abs(n-tt)<.5||!F&&Math.abs(i-et)<.5)||(At(),ct(),tt=n,et=i,F&&!tt||!F&&!et||V&&C&&(t===Z.length&&(null==S?void 0:S.isPointerDown())||(it("dragFree")&&(q||B>X&&B<Y)?(ut(),Dt()):Ct(_,{transition:false}))));}(),t=null;}));}),j.observe(C);}}(),rt("ready"));}}function at(t){b=t;}function ct(){ false===it("gestures")?S&&(S.destroy(),S=void 0):S||function(){const t=it("gestures");!S&&false!==t&&C&&(S=f$1(C,t).on("start",t=>{var e,n;if(!A)return;if(false===it("gestures",t))return;const{srcEvent:o}=t;F&&e$4(o)&&!n$8(o.target)&&m$1(o),A.pause(),A.getCurrentVelocities().pos=0;const s=null===(e=Z[_])||void 0===e?void 0:e.slides[0],r=null==s?void 0:s.el;s&&Q.has(s.index)&&r&&(B=s.offset||0,B+=(function(t){const e=window.getComputedStyle(t),n=new DOMMatrixReadOnly(e.transform);return {width:n.m41||0,height:n.m42||0}}(r)[z]||0)*(k&&!F?1:-1)),Lt(),q||(B<X||B>Y)&&A.spring({clamp:true,mass:1,tension:500,friction:25,velocity:(null===(n=A.getCurrentVelocities())||void 0===n?void 0:n.pos)||0,restDelta:1,restSpeed:1}).from({pos:B}).to({pos:t$6(X,B,Y)}).start();}).on("move",t=>{var e,n;if(false===it("gestures",t))return;const{srcEvent:o,axis:s,deltaX:r,deltaY:l}=t;if(e$4(o)&&(null===(e=o.touches)||void 0===e?void 0:e.length)>1)return;const a=o.target,c=n$8(a),d=c?c.scrollHeight>c.clientHeight?"y":"x":void 0;if(c&&c!==C&&(!s||s===d))return;if(!s)return m$1(o),o.stopPropagation(),void o.stopImmediatePropagation();if("y"===s&&!F||"x"===s&&F)return;if(m$1(o),o.stopPropagation(),!A)return;const u=k&&!F?1:-1,f=F?l:r;let v=(null==A?void 0:A.isRunning())?A.getEndValues().pos:B,g=1;q||(v<=X&&f*u<0?(g=Math.max(.01,1-(Math.abs(1/mt()*Math.abs(v-X))||0)),g*=.2):v>=Y&&f*u>0&&(g=Math.max(.01,1-(Math.abs(1/mt()*Math.abs(v-Y))||0)),g*=.2)),v+=f*g*u,A.spring({clamp:true,mass:1,tension:700,friction:25,velocity:(null===(n=A.getCurrentVelocities())||void 0===n?void 0:n.pos)||0,restDelta:1,restSpeed:1}).from({pos:B}).to({pos:v}).start();}).on("panstart",t=>{ false!==it("gestures",t)&&(null==t?void 0:t.axis)===(F?"y":"x")&&s$7(C,"is-dragging");}).on("panend",t=>{ false!==it("gestures",t)&&s$6(C,"is-dragging");}).on("end",t=>{var e,n;if(false===it("gestures",t))return;const{srcEvent:o,axis:s,velocityX:r,velocityY:l,currentTouch:c}=t;if(c.length>0||!A)return;const d=o.target,u=n$8(d),f=u?u.scrollHeight>u.clientHeight?"y":"x":void 0,v=u&&(!s||s===f);F&&e$4(o)&&!s&&Tt(o);const g=Z.length,m=it("dragFree");if(!g)return;let h=v?0:it("vertical")?l:r;s!==(F?"y":"x")&&(h=0);let b=(null==A?void 0:A.isRunning())?A.getEndValues().pos:B;const y=k&&!F?1:-1;if(v||(b+=h*(m?5:1)*y),!q&&(h*y<=0&&b<X||h*y>=0&&b>Y)){let t=0;return Math.abs(h)>0&&(t=2*Math.abs(h),t=Math.min(.3*mt(),t)),b=t$6(X+-1*t,b,Y+t),void A.spring({clamp:true,mass:1,tension:380,friction:25,velocity:-1*h,restDelta:1,restSpeed:1}).from({pos:B}).to({pos:b}).start()}if(m||(null===(e=H.Autoscroll)||void 0===e?void 0:e.isEnabled()))return void(Math.abs(h)>10?A.spring({clamp:true,mass:1,tension:150,friction:25,velocity:-1*h,restDelta:1,restSpeed:1}).from({pos:B}).to({pos:b}).start():A.isRunning()||N||(N=true,rt("settle")));if(!m&&!(null===(n=H.Autoscroll)||void 0===n?void 0:n.isEnabled())&&(!t.offsetX&&!t.offsetY||"y"===s&&!F||"x"===s&&F))return void Ct(_,{transition:"tween"});let E=pt(b);Math.abs(h)>10&&E===_&&(E+=h>0?k&&!F?1:-1:k&&!F?-1:1),Ct(E,{transition:"tween",tween:{velocity:-1*h}});}).init());}(),s$5(C,"is-draggable",!!S&&Z.length>0);}function dt(t="*"){var e;const n=[];for(const i of J)("*"===t||i.class&&i.class.includes(t)||i.el&&(null===(e=i.el)||void 0===e?void 0:e.classList.contains(t)))&&n.push(i);L=void 0,W=t,K=[...n];}function ut(){if(!A)return;const t=pt((null==A?void 0:A.isRunning())?A.getEndValues().pos:B);t!==_&&(L=_,_=t,Vt(),ft(),vt(),rt("change",_,L));}function ft(){var t,e;if(!V)return;for(const t of V.querySelectorAll("[data-carousel-index]"))t.innerHTML=_+"";for(const t of V.querySelectorAll("[data-carousel-page]"))t.innerHTML=_+1+"";for(const t of V.querySelectorAll("[data-carousel-pages]"))t.innerHTML=Z.length+"";const n=it("classes")||{},i=Array.from(V.querySelectorAll("[data-carousel-go-to]")).filter(t=>t.closest(`.${n.container}`)===V);for(const e of i){parseInt((null===(t=e.dataset)||void 0===t?void 0:t.carouselGoTo)||"-1",10)===_?e.setAttribute("aria-current","true"):e.removeAttribute("aria-current");}for(const t of V.querySelectorAll("[data-carousel-go-prev]"))t.toggleAttribute("aria-disabled",!qt()),qt()?t.removeAttribute("tabindex"):t.setAttribute("tabindex","-1");for(const t of V.querySelectorAll("[data-carousel-go-next]"))t.toggleAttribute("aria-disabled",!kt()),kt()?t.removeAttribute("tabindex"):t.setAttribute("tabindex","-1");let o=false;const s=null===(e=Z[_])||void 0===e?void 0:e.slides[0];s&&(s.downloadSrc||"image"===s.type&&s.src)&&(o=true);for(const t of V.querySelectorAll("[data-carousel-download]"))t.toggleAttribute("aria-disabled",!o);}function vt(t){var e;t||(t=null===(e=Z[_])||void 0===e?void 0:e.slides[0]);const n=null==t?void 0:t.el;if(n)for(const e of n.querySelectorAll("[data-slide-index]"))e.innerHTML=t.index+1+"";}function pt(t){var e,n,i;if(!Z.length)return 0;const o=ht();let s=t;q?s-=Math.floor((t-(null===(e=Z[0])||void 0===e?void 0:e.pos))/o)*o||0:s=t$6(null===(n=Z[0])||void 0===n?void 0:n.pos,t,null===(i=Z[Z.length-1])||void 0===i?void 0:i.pos);const r=new Map;let l=0;for(const t of Z){const e=Math.abs(t.pos-s),n=Math.abs(t.pos-s-o),i=Math.abs(t.pos-s+o),a=Math.min(e,n,i);r.set(l,a),l++;}const c=r.size>0?[...r.entries()].reduce((t,e)=>e[1]<t[1]?e:t):[_,0];return parseInt(c[0])}function gt(){return nt}function mt(){return $}function ht(t=true){return K.length?K.reduce((t,e)=>t+e.dim,0)+(K.length-(q&&t?0:1))*nt:0}function bt(t){const e=ht(),n=mt();if(!e||!C||!n)return [];const i=[];t=void 0===t?B:t,q&&(t-=Math.floor(t/e)*e||0);let o=0;for(let s of K){const r=(e=0)=>{i.indexOf(s)>-1||(s.pos=o-t+e||0,s.offset+e>t-s.dim-D+.51&&s.offset+e<t+n+I-.51&&i.push(s));};s.offset=o,q&&(r(e),r(-1*e)),r(),o+=s.dim+nt;}return i}function yt(t,e){const n=[];for(const e of Array.isArray(t)?t:[t]){const t=Et(Object.assign(Object.assign({},e),{isVirtual:true}));t.el||(t.el=document.createElement("div")),rt("createSlide",t),n.push(t);}J.splice(void 0===e?J.length:e,0,...n),St();for(const t of n)rt("addSlide",t),xt(t);return dt(W),n}function Et(t){return (t$7(t)||t instanceof HTMLElement)&&(t={html:t}),Object.assign({index:-1,el:void 0,class:"",isVirtual:true,dim:0,pos:0,offset:0,html:"",src:""},t)}function xt(t){let e=t.el;if(!t||!e)return;const n=t.html?t.html instanceof HTMLElement?t.html:e$7(t.html):void 0;n&&(s$7(n,"f-html"),t.htmlEl=n,s$7(e,"has-html"),e.append(n),rt("contentReady",t));}function Mt(t){if(!C||!t)return;let e=t.el;if(e){if(e.setAttribute("index",t.index+""),e.parentElement!==C){let n;s$7(e,R.classes.slide),s$7(e,t.class),Vt(t);for(const e of J)if(e.index>t.index){n=e.el;break}C.insertBefore(e,n&&C.contains(n)?n:null),rt("attachSlideEl",t);}return vt(t),e}}function wt(t){const e=null==t?void 0:t.el;e&&(e.remove(),jt(e),rt("detachSlideEl",t));}function St(){for(let t=0;t<J.length;t++){const e=J[t],n=e.el;n&&(e.index!==t&&jt(n),n.setAttribute("index",`${t}`)),e.index=t;}}function At(){var t,n,i,o,s;if(!V||!C)return;k=it("rtl"),F=it("vertical"),z=F?"height":"width";const r=it("classes");if(s$5(V,r.isLTR,!k),s$5(V,r.isRTL,k),s$5(V,r.isHorizontal,!F),s$5(V,r.isVertical,F),s$5(V,r.hasAdaptiveHeight,it("adaptiveHeight")),$=0,D=0,I=0,nt=0,C){C.childElementCount||(C.style.display="grid");const t=C.getBoundingClientRect();$=C.getBoundingClientRect()[z]||0;const e=window.getComputedStyle(C);nt=parseFloat(e.getPropertyValue("--f-carousel-gap"))||0;"visible"===e.getPropertyValue("overflow-"+(F?"y":"x"))&&(D=Math.abs(t[F?"top":"left"]),I=Math.abs(window[F?"innerHeight":"innerWidth"]-t[F?"bottom":"right"])),C.style.display="";}if(!$)return;const l=function(){let t=0;if(C){let e=document.createElement("div");e.style.display="block",s$7(e,R.classes.slide),C.appendChild(e),t=e.getBoundingClientRect()[z],e.remove(),e=void 0;}return t}();for(const n of K){const i=n.el;let o=0;if(!n.isVirtual&&i&&n$9(i)){let e=false;i.parentElement&&i.parentElement===C||(C.appendChild(i),e=true),o=i.getBoundingClientRect()[z],e&&(null===(t=i.parentElement)||void 0===t||t.removeChild(i));}else o=l;n.dim=o;}if(q=false,it("infinite")){q=true;const t=ht();let e=$+D+I;for(let i=0;i<K.length;i++){const o=(null===(n=K[i])||void 0===n?void 0:n.dim)+nt;if(t-o<e&&t-o-e<o){q=false;break}}}!function(){var t;if(!V)return;const e=mt(),n=ht(false);let i=it("slidesPerPage");i="auto"===i?1/0:parseFloat(i+""),Z=[];let o=0,s=0;for(const n of K)(!Z.length||o+n.dim-e>.05||s>=i)&&(Z.push({index:Z.length,slides:[],dim:0,offset:0,pos:0}),o=0,s=0),null===(t=Z[Z.length-1])||void 0===t||t.slides.push(n),o+=n.dim+nt,s++;const r=it("center"),l=it("fill");let c=0;for(const t of Z){t.dim=(t.slides.length-1)*nt;for(const e of t.slides)t.dim+=e.dim;t.offset=c,t.pos=c,false!==r&&(t.pos-=.5*(e-t.dim)),l&&!q&&n>e&&(t.pos=t$6(0,t.pos,n-e)),c+=t.dim+nt;}const d=[];let u;for(const t of Z){const e=Object.assign({},t);u&&Math.abs(e.pos-u.pos)<.1?(u.dim+=e.dim,u.slides=[...u.slides,...e.slides]):(u=e,e.index=d.length,d.push(e));}Z=d,_=t$6(0,_,Z.length-1);}(),X=(null===(i=Z[0])||void 0===i?void 0:i.pos)||0,Y=(null===(o=Z[Z.length-1])||void 0===o?void 0:o.pos)||0,0===T?function(){var t;L=void 0,_=it("initialPage");const e=it("initialSlide")||void 0;void 0!==e&&(_=Ft.getPageIndex(e)||0),_=t$6(0,_,Z.length-1),B=(null===(t=Z[_])||void 0===t?void 0:t.pos)||0,G=B;}():G=(null===(s=Z[_||0])||void 0===s?void 0:s.pos)||0,rt("refresh"),ft();}function jt(t){if(!t||!n$9(t))return;const n=parseInt(t.getAttribute("index")||"-1");let i="";for(const e of Array.from(t.classList)){const t=e.match(/^f-(\w+)(Out|In)$/);t&&t[1]&&(i=t[1]+"");}if(!t||!i)return;const o=[`f-${i}Out`,`f-${i}In`,"to-prev","to-next","from-prev","from-next"];t.removeEventListener("animationend",Pt),s$6(t,o.join(" ")),Q.delete(n);}function Lt(){if(!C)return;const t=Q.size>0;for(const t of K)jt(t.el);Q.clear(),t&&Dt();}function Pt(t){var e;"f-"===(null===(e=t.animationName)||void 0===e?void 0:e.substring(0,2))&&(jt(t.target),Q.size||(s$6(V,"in-transition"),!N&&Math.abs(Ft.getPosition(true)-G)<.5&&(N=true,rt("settle"))),Dt());}function Tt(t){Ot(t),rt("click",t);}function Ot(t){var e;if(t.defaultPrevented)return;const n=t.composedPath()[0];if(n.closest("[data-carousel-go-prev]"))return m$1(t),void Ft.prev();if(n.closest("[data-carousel-go-next]"))return m$1(t),void Ft.next();const i=n.closest("[data-carousel-go-to]");if(i)return m$1(t),void Ft.goTo(parseFloat(i.dataset.carouselGoTo||"")||0);if(n.closest("[data-carousel-download]")){m$1(t);const n=null===(e=Z[_])||void 0===e?void 0:e.slides[0];if(n&&(n.downloadSrc||"image"===n.type&&n.src)){const t=n.downloadFilename,e=document.createElement("a"),i=n.downloadSrc||n.src||"";e.href=i,e.target="_blank",e.download=t||i,e.click();}return}}function Rt(t){var e;const n=t.el;n&&(null===(e=n.querySelector(".f-spinner"))||void 0===e||e.remove());}function Ht(t){var e;const n=t.el;n&&(null===(e=n.querySelector(".f-html.is-error"))||void 0===e||e.remove(),s$6(n,"has-error"));}function Vt(t){var e;t||(t=null===(e=Z[_])||void 0===e?void 0:e.slides[0]);const i=null==t?void 0:t.el;if(!i)return;let o=it("formatCaption",t);void 0===o&&(o=t.caption),o=o||"";const s=it("captionEl");if(s&&s instanceof HTMLElement){if(t.index!==_)return;if(t$7(o)&&(s.innerHTML=ot(o+"")),o instanceof HTMLElement){if(o.parentElement===s)return;s.innerHTML="",o.parentElement&&(o=o.cloneNode(true)),s.append(o);}return}if(!o)return;let r=t.captionEl||i.querySelector(".f-caption");!r&&o instanceof HTMLElement&&o.classList.contains("f-caption")&&(r=o),r||(r=document.createElement("div"),s$7(r,"f-caption"),t$7(o)?r.innerHTML=ot(o+""):o instanceof HTMLElement&&(o.parentElement&&(o=o.cloneNode(true)),r.append(o)));const l=`f-caption-${E}_${t.index}`;r.setAttribute("id",l),r.dataset.selectable="true",s$7(i,"has-caption"),i.setAttribute("aria-labelledby",l),t.captionEl=r,i.insertAdjacentElement("beforeend",r);}function Ct(e,i={}){var o,r;let{transition:l,tween:u}=Object.assign({transition:R.transition,tween:R.tween},i||{});if(!V||!A)return;const f=Z.length;if(!f)return;if(function(t,e){var i,o,s;if(!(V&&$&&A&&e&&t$7(e)&&"tween"!==e))return  false;for(const t of U)if($-t.dim>.5)return  false;if(D>.5||I>.5)return;const r=Z.length;let l=t>_?1:-1;t=q?(t%r+r)%r:t$6(0,t,r-1),k&&(l*=-1);const u=null===(i=Z[_])||void 0===i?void 0:i.slides[0],f=null==u?void 0:u.index,v=null===(o=Z[t])||void 0===o?void 0:o.slides[0],p=null==v?void 0:v.index,g=null===(s=Z[t])||void 0===s?void 0:s.pos;if(void 0===p||void 0===f||f===p||B===g||Math.abs($-((null==v?void 0:v.dim)||0))>1)return  false;N=false,A.pause(),Lt(),s$7(V,"in-transition"),B=G=g;const m=Mt(u),h=Mt(v);return ut(),m&&(Q.add(f),m.style.transform="",m.addEventListener("animationend",Pt),s$6(m,R.classes.isSelected),m.inert=false,s$7(m,`f-${e}Out to-${l>0?"next":"prev"}`)),h&&(Q.add(p),h.style.transform="",h.addEventListener("animationend",Pt),s$7(h,R.classes.isSelected),h.inert=false,s$7(h,`f-${e}In from-${l>0?"prev":"next"}`)),Dt(),true}(e,l))return;e=q?(e%f+f)%f:t$6(0,e,f-1);const v=(null===(o=Z[e||0])||void 0===o?void 0:o.pos)||0;G=v;const p=A.isRunning()?A.getEndValues().pos:B;if(Math.abs(G-p)<1)return B=G,_!==e&&(Vt(),L=_,_=e,ft(),vt(),rt("change",_,L)),Dt(),void(N||(N=true,rt("settle")));if(A.pause(),Lt(),q){const t=ht(),e=Math.floor((p-(null===(r=Z[0])||void 0===r?void 0:r.pos))/t)||0,n=G+e*t;G=[n+t,n,n-t].reduce(function(t,e){return Math.abs(e-p)<Math.abs(t-p)?e:t});} false!==l&&t$5(u)?A.spring(r$3({},R.tween,u)).from({pos:B}).to({pos:G}).start():(B=G,ut(),Dt(),N||(N=true,rt("settle")));}function $t(t){var e;let n=B;if(q&&true!==t){const t=ht();n-=(Math.floor((B-(null===(e=Z[0])||void 0===e?void 0:e.pos)||0)/t)||0)*t;}return n}function Dt(){var t;if(!V||!C)return;U=bt();const e=new Set,n=[],i=Z[_],s=R.setTransform;let l;for(const o of K){const s=Q.has(o.index),r=U.indexOf(o)>-1,a=(null===(t=null==i?void 0:i.slides)||void 0===t?void 0:t.indexOf(o))>-1;if(o.isVirtual&&!s&&!r)continue;let c=Mt(o);if(c&&(n.push(o),a&&e.add(c),it("adaptiveHeight")&&a)){const t=(c.lastElementChild||c).getBoundingClientRect().height;l=null==l?t:Math.max(l,t);}}C&&l&&(C.style.height=`${l}px`),[...e$2(C,`.${R.classes.slide}`)].forEach(t=>{s$5(t,R.classes.isSelected,e.has(t));const n=J[parseInt(t.getAttribute("index")||"-1")];if(!n)return t.remove(),void jt(t);const i=Q.has(n.index),o=U.indexOf(n)>-1;if(n.isVirtual&&!i&&!o)return void wt(n);if(t.inert=!o,false===s)return;let l=n.pos?Math.round(1e4*n.pos)/1e4:0,a=0,c=0,d=0,f=0;i||(a=F?0:k?-1*l:l,c=F?l:0,d=t$3(a,0,n.dim,0,100),f=t$3(c,0,n.dim,0,100)),s instanceof Function&&!i?s(Ft,n,{x:a,y:c,xPercent:d,yPercent:f}):t.style.transform=a||c?`translate3d(${d}%, ${f}%,0)`:"";}),rt("render",n);}function It(){null==V||V.removeEventListener("click",Tt),document.removeEventListener("mousemove",at),Q.clear(),null==j||j.disconnect(),j=void 0;for(const t of J){let n=t.el;n&&n$9(n)&&(t.state=void 0,Rt(t),Ht(t),t.isVirtual?(wt(t),t.el=void 0):(jt(n),n.style.transform="",C&&!C.contains(n)&&C.appendChild(n)));}for(const t of Object.values(H))null==t||t.destroy();H={},null==S||S.destroy(),S=void 0,null==A||A.destroy(),A=void 0;for(const[t,e]of Object.entries(R.classes||{}))"container"!==t&&s$6(V,e);s$6(C,"is-draggable");}function qt(){return q||_>0}function kt(){return q||_<Z.length-1}const Ft={add:function(t,e){var n;let i=B;const o=_,s=ht(),r=(null==A?void 0:A.isRunning())?A.getEndValues().pos:B,l=s&&Math.floor((r-((null===(n=Z[0])||void 0===n?void 0:n.pos)||0))/s)||0;return yt(t,e),dt(W),At(),A&&s&&(o===_&&(i-=l*s),i===G?B=G:A.spring({clamp:true,mass:1,tension:300,friction:25,restDelta:1,restSpeed:1}).from({pos:i}).to({pos:G}).start()),Dt(),Ft},canGoPrev:qt,canGoNext:kt,destroy:function(){return rt("destroy"),window.removeEventListener("resize",lt),It(),st.clear(),V=null,Z=[],J=[],R=Object.assign({},h$1),H={},K=[],P=void 0,W="*",T=2,Ft},emit:rt,filter:function(t="*"){return dt(t),At(),B=t$6(X,B,Y),Dt(),rt("filter",t),Ft},getContainer:function(){return V},getGapDim:gt,getGestures:function(){return S},getLastMouseMove:function(){return b},getOption:function(t){return it(t)},getOptions:function(){return R},getPage:function(){return Z[_]},getPageIndex:function(t){if(void 0!==t){for(const e of Z||[])for(const n of e.slides)if(n.index===t)return e.index;return  -1}return _},getPageIndexFromPosition:pt,getPageProgress:function(t,e){var n;void 0===t&&(t=_);const i=Z[t];if(!i)return t>_?-1:1;const o=ht(),s=gt();let r=i.pos,l=$t();if(q&&true!==e){const t=Math.floor((l-(null===(n=Z[0])||void 0===n?void 0:n.pos))/o)||0;l-=t*o,r=[r+o,r,r-o].reduce(function(t,e){return Math.abs(e-l)<Math.abs(t-l)?e:t});}return (l-r)/(i.dim+s)||0},getPageVisibility:function(t){var e;void 0===t&&(t=_);const n=Z[t];if(!n)return t>_?-1:1;const i=$t(),o=mt();let s=n.pos;if(q){const t=ht(),n=s+(Math.floor((i-(null===(e=Z[0])||void 0===e?void 0:e.pos))/t)||0)*t;s=[n+t,n,n-t].reduce(function(t,e){return Math.abs(e-i)<Math.abs(t-i)?e:t});}return s>i&&s+n.dim<i+o?1:s<i?(s+n.dim-i)/n.dim||0:s+n.dim>i+o&&(i+o-s)/n.dim||0},getPages:function(){return Z},getPlugins:function(){return H},getPosition:$t,getSlides:function(){return J},getState:function(){return T},getTotalSlideDim:ht,getTween:function(){return A},getViewport:function(){return C},getViewportDim:mt,getVisibleSlides:function(t){return void 0===t?U:bt(t)},goTo:Ct,hasNavigated:function(){return void 0!==L},hideError:Ht,hideLoading:Rt,init:function(){if(!g||!n$9(g))throw new Error("No Element found");return 0!==T&&(It(),T=0),V=g,O=M,window.removeEventListener("resize",lt),O.breakpoints&&window.addEventListener("resize",lt),lt(),Ft},isInfinite:function(){return q},isInTransition:function(){return Q.size>0},isRTL:function(){return k},isSettled:function(){return N},isVertical:function(){return F},localize:ot,next:function(t={}){return Ct(_+1,t),Ft},off:function(t,e){for(const n of t instanceof Array?t:[t])st.has(n)&&st.set(n,st.get(n).filter(t=>t!==e));return Ft},on:function(t,e){for(const n of t instanceof Array?t:[t])st.set(n,[...st.get(n)||[],e]);return Ft},prev:function(t={}){return Ct(_-1,t),Ft},reInit:function(e={},n){return It(),T=0,P=void 0,W="*",M=e,O=e,t$5(n)&&(w=n),lt(),Ft},remove:function(t){ void 0===t&&(t=J.length-1);const e=J[t];return e&&(rt("removeSlide",e),e.el&&(jt(e.el),e.el.remove(),e.el=void 0),J.splice(t,1),dt(W),At(),B=t$6(X,B,Y),Dt()),Ft},setPosition:function(t){B=t,ut(),Dt();},showError:function(t,e){if(1===T){Rt(t),Ht(t);const n=t.el;if(n){const i=document.createElement("div");s$7(i,"f-html"),s$7(i,"is-error"),i.innerHTML=ot(e||"<p>{{ERROR}}</p>"),t.htmlEl=i,s$7(n,"has-html has-error"),n.insertAdjacentElement("afterbegin",i),rt("contentReady",t);}}return Ft},showLoading:function(t){const e=t.el,n=null==e?void 0:e.querySelector(".f-spinner");if(!e||n)return Ft;const i=it("spinnerTpl"),o=e$7(i);return o&&(s$7(o,"f-spinner"),e.insertAdjacentElement("beforeend",o)),Ft},version:"6.1.14"};return Ft};x.l10n={en_EN:o$5},x.getDefaults=()=>h$1;

/*! License details at fancyapps.com/license */
const t$2=(t=true,e="--f-scrollbar-compensate",s="--f-body-margin",o="hide-scrollbar")=>{const n=document,r=n.body,l=n.documentElement;if(t){if(r.classList.contains(o))return;let t=window.innerWidth-l.getBoundingClientRect().width;t<0&&(t=0),l.style.setProperty(e,`${t}px`);const n=parseFloat(window.getComputedStyle(r).marginRight);n&&r.style.setProperty(s,`${n}px`),r.classList.add(o);}else r.classList.remove(o),r.style.setProperty(s,""),n.documentElement.style.setProperty(e,"");};

/*! License details at fancyapps.com/license */
function e$1(){return !("undefined"==typeof window||!window.document||!window.document.createElement)}

/*! License details at fancyapps.com/license */
const n$5=function(n="",t="",o=""){return n.split(t).join(o)};

/*! License details at fancyapps.com/license */
const a$3={tpl:t=>`<img class="f-panzoom__content" \n    ${t.srcset?'data-lazy-srcset="{{srcset}}"':""} \n    ${t.sizes?'data-lazy-sizes="{{sizes}}"':""} \n    data-lazy-src="{{src}}" alt="{{alt}}" />`},s$4=()=>{let s;function l(e,o){const n=null==s?void 0:s.getOptions().Zoomable;let i=(t$5(n)?Object.assign(Object.assign({},a$3),n):a$3)[e];return i&&"function"==typeof i&&o?i(o):i}function c(){s&&false!==s.getOptions().Zoomable&&(s.on("addSlide",f),s.on("removeSlide",u),s.on("attachSlideEl",g),s.on("click",d),s.on("change",r),s.on("ready",r));}function r(){m();const t=(null==s?void 0:s.getVisibleSlides())||[];if(t.length>1||"slide"===(null==s?void 0:s.getOption("transition")))for(const e of t){const t=e.panzoomRef;t&&((null==s?void 0:s.getPage().slides)||[]).indexOf(e)<0&&t.execute(v$2.ZoomTo,Object.assign({},t.getStartPosition()));}}function d(t,e){const o=e.target;o&&!e.defaultPrevented&&o.dataset.panzoomAction&&p(o.dataset.panzoomAction);}function f(t,i){const a=i.el;if(!s||!a||i.panzoomRef)return;const c=i.src||i.lazySrc||"",r=i.alt||i.caption||`Image #${i.index}`,d=i.srcset||i.lazySrcset||"",f=i.sizes||i.lazySizes||"";if(c&&t$7(c)&&!i.html&&(!i.type||"image"===i.type)){i.type="image",i.thumbSrc=i.thumbSrc||c;let t=l("tpl",i);t=n$5(t,"{{src}}",c+""),t=n$5(t,"{{srcset}}",d+""),t=n$5(t,"{{sizes}}",f+""),a.insertAdjacentHTML("afterbegin",t);}const u=a.querySelector(".f-panzoom__content");if(!u)return;u.setAttribute("alt",r+"");const g=i.width&&"auto"!==i.width?parseFloat(i.width+""):"auto",p=i.height&&"auto"!==i.height?parseFloat(i.height+""):"auto",z=S(a,Object.assign({width:g,height:p,classes:{container:"f-zoomable"},event:()=>null==s?void 0:s.getLastMouseMove(),spinnerTpl:()=>(null==s?void 0:s.getOption("spinnerTpl"))||""},l("Panzoom")));z.on("*",(t,e,...o)=>{s&&("loading"===e&&(i.state=0),"loaded"===e&&(i.state=1),"error"===e&&(i.state=2,null==s||s.showError(i,"{{IMAGE_ERROR}}")),s.emit(`panzoom:${e}`,i,...o),"loading"===e&&s.emit("contentLoading",i),"ready"===e&&s.emit("contentReady",i),i.index===(null==s?void 0:s.getPageIndex())&&m());}),i.panzoomRef=z;}function u(t,e){e.panzoomRef&&(e.panzoomRef.destroy(),e.panzoomRef=void 0);}function g(t,e){const o=e.panzoomRef;if(o)switch(o.getState()){case 0:o.init();break;case 3:o.execute(v$2.ZoomTo,Object.assign(Object.assign({},o.getStartPosition()),{velocity:0}));}}function m(){var t,e;const o=(null==s?void 0:s.getContainer())||void 0,n=null===(e=null===(t=null==s?void 0:s.getPage())||void 0===t?void 0:t.slides[0])||void 0===e?void 0:e.panzoomRef;if(o)if(n)n.updateControls(o);else for(const t of o.querySelectorAll("[data-panzoom-action]")||[])t.setAttribute("aria-disabled",""),t.setAttribute("tabindex","-1");}function p(t,...e){var o;null===(o=null==s?void 0:s.getPage().slides[0].panzoomRef)||void 0===o||o.execute(t,...e);}return {init:function(t){s=t,s.on("initPlugins",c);},destroy:function(){if(s){s.off("initPlugins",c),s.off("addSlide",f),s.off("removeSlide",u),s.off("attachSlideEl",g),s.off("click",d),s.off("change",r),s.off("ready",r);for(const t of s.getSlides())u(0,t);}s=void 0;},execute:p}};

/*! License details at fancyapps.com/license */
const e={syncOnChange:false,syncOnClick:true,syncOnHover:false},i$4=()=>{let i,t;function o(){const t=null==i?void 0:i.getOptions().Sync;return t$5(t)?Object.assign(Object.assign({},e),t):e}function s(n){var e,s,l;i&&n&&(t=n,i.getOptions().classes=Object.assign(Object.assign({},i.getOptions().classes),{isSelected:""}),i.getOptions().initialSlide=(null===(s=null===(e=t.getPage())||void 0===e?void 0:e.slides[0])||void 0===s?void 0:s.index)||0,o().syncOnChange&&i.on("change",c),o().syncOnClick&&i.on("click",g),o().syncOnHover&&(null===(l=i.getViewport())||void 0===l||l.addEventListener("mouseover",u)),function(){if(!i||!t)return;i.on("ready",d),i.on("refresh",a),t.on("change",r),t.on("filter",f);}());}function l(){const n=o().target;i&&n&&s(n);}function d(){v();}function c(){var n;if(i&&t){const e=(null===(n=i.getPage())||void 0===n?void 0:n.slides)||[],o=t.getPageIndex(e[0].index||0);o>-1&&t.goTo(o,i.hasNavigated()?void 0:{tween:false,transition:false}),v();}}function r(){var n;if(i&&t){const e=i.getPageIndex((null===(n=t.getPage())||void 0===n?void 0:n.slides[0].index)||0);e>-1&&i.goTo(e,t.hasNavigated()?void 0:{tween:false,transition:false}),v();}}function g(n,e){var o;if(!i||!t)return;if(null===(o=i.getTween())||void 0===o?void 0:o.isRunning())return;const s=null==i?void 0:i.getOptions().classes.slide;if(!s)return;const l=e.target.closest(`.${s}`);if(l){const n=parseInt(l.getAttribute("index")||"")||0,e=t.getPageIndex(n);t.goTo(e);}}function u(n){i&&g(0,n);}function a(){var n;if(i&&t){const e=i.getPageIndex((null===(n=t.getPage())||void 0===n?void 0:n.slides[0].index)||0);e>-1&&i.goTo(e,{tween:false,transition:false}),v();}}function f(n,e){i&&t&&(i.filter(e),r());}function v(){var n,e,o;if(!t)return;const s=(null===(e=null===(n=t.getPage())||void 0===n?void 0:n.slides[0])||void 0===e?void 0:e.index)||0;for(const n of (null==i?void 0:i.getSlides())||[])null===(o=n.el)||void 0===o||o.classList.toggle("is-selected",n.index===s);}return {init:function(n){i=n,i.on("initSlides",l);},destroy:function(){var n;null==i||i.off("ready",d),null==i||i.off("refresh",a),null==i||i.off("change",c),null==i||i.off("click",g),null===(n=null==i?void 0:i.getViewport())||void 0===n||n.removeEventListener("mouseover",u),null==t||t.off("change",r),null==t||t.off("filter",f),t=void 0,null==i||i.off("initSlides",l),i=void 0;},getTarget:function(){return t}}};

/*! License details at fancyapps.com/license */
const s$3={showLoading:true,preload:1},l$5="is-lazyloading",o$4="is-lazyloaded",n$4="has-lazyerror",i$3=()=>{let i;function d(){const e=null==i?void 0:i.getOptions().Lazyload;return t$5(e)?Object.assign(Object.assign({},s$3),e):s$3}function r(t){var s;const r=t.el;if(!r)return;const c=d(),u="[data-lazy-src],[data-lazy-srcset],[data-lazy-bg]",f=Array.from(r.querySelectorAll(u));r.matches(u)&&f.push(r);for(const d of f){const r=d.dataset.lazySrc,u=d.dataset.lazySrcset,f=d.dataset.lazySizes,y=d.dataset.lazyBg,z=(d instanceof HTMLImageElement||d instanceof HTMLSourceElement)&&(r||u),g=!!y;if(!z&&!g)continue;const m=r||u||y;if(m){if(z){const y=null===(s=d.parentElement)||void 0===s?void 0:s.classList.contains("f-panzoom__wrapper");c.showLoading&&(null==i||i.showLoading(t)),d.addEventListener("load",()=>{null==i||i.hideLoading(t),s$6(d,n$4),d instanceof HTMLImageElement?d.decode().finally(()=>{s$6(d,l$5),s$7(d,o$4);}).catch(()=>{}):(s$6(d,l$5),s$7(d,o$4)),y||null==i||i.emit("lazyLoad:loaded",t,d,m);}),d.addEventListener("error",()=>{null==i||i.hideLoading(t),s$6(d,l$5),s$7(d,n$4),y||null==i||i.emit("lazyLoad:error",t,d,m);}),d.classList.add("f-lazyload"),d.classList.add(l$5),y||null==i||i.emit("lazyLoad:load",t,d,m),r&&(d.src=r),u&&(d.srcset=u),f&&(d.sizes=f);}else g&&(d.style.backgroundImage=`url('${y}')`);delete d.dataset.lazySrc,delete d.dataset.lazySrcset,delete d.dataset.lazySizes,delete d.dataset.lazyBg;}}}function c(){if(!i)return;const e=[...i.getVisibleSlides()],t=d().preload;if(t>0){const a=i.getPosition(),s=i.getViewportDim();e.push(...i.getVisibleSlides(a+s*t),...i.getVisibleSlides(a-s*t));}for(const t of e)r(t);}return {init:function(e){i=e,i.on("render",c);},destroy:function(){null==i||i.off("render",c),i=void 0;}}};

/*! License details at fancyapps.com/license */
const i$2='<svg width="24" height="24" viewBox="0 0 24 24" tabindex="-1">',r$2="</svg>",s$2={prevTpl:i$2+'<path d="M15 3l-9 9 9 9"></path>'+r$2,nextTpl:i$2+'<path d="M9 3l9 9-9 9"></path>'+r$2},l$4=()=>{let i,r,l;function a(o){const r=function(){const t=null==i?void 0:i.getOptions().Arrows;return t$5(t)?Object.assign(Object.assign({},s$2),t):s$2}(),l=`<button data-carousel-go-${o} tabindex="0" class="f-button is-arrow is-${o}" title="{{${o.toUpperCase()}}}">`+r[`${o}Tpl`]+"</button>",a=e$7(i.localize(l))||void 0;return a&&s$7(a,r[`${o}Class`]),a}function u(){var t;null==r||r.remove(),r=void 0,null==l||l.remove(),l=void 0,null===(t=null==i?void 0:i.getContainer())||void 0===t||t.classList.remove("has-arrows");}function c(){i&&false!==i.getOptions().Arrows&&i.getPages().length>1?(!function(){if(!i)return;const t=i.getViewport();t&&(r||(r=a("prev"),r&&t.insertAdjacentElement("beforebegin",r)),l||(l=a("next"),l&&t.insertAdjacentElement("afterend",l)),s$5(i.getContainer(),"has-arrows",true));}(),i&&(null==r||r.toggleAttribute("aria-disabled",!i.canGoPrev()),null==l||l.toggleAttribute("aria-disabled",!i.canGoNext()))):u();}return {init:function(t){i=t.on(["change","refresh"],c);},destroy:function(){u(),null==i||i.off(["change","refresh"],c),i=void 0;}}};

/*! License details at fancyapps.com/license */
const t$1='<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.35-4.35M8 11h6"/>',M$1='<g><line x1="11" y1="8" x2="11" y2="14"></line></g>'+t$1,o$3={moveLeft:["moveLeft","MOVE_LEFT",'<path d="M5 12h14M5 12l6 6M5 12l6-6"/>'],moveRight:["moveRight","MOVE_RIGHT",'<path d="M5 12h14M13 18l6-6M13 6l6 6"/>'],moveUp:["moveUp","MOVE_UP",'<path d="M12 5v14M18 11l-6-6M6 11l6-6"/>'],moveDown:["moveDown","MOVE_DOWN",'<path d="M12 5v14M18 13l-6 6M6 13l6 6"/>'],zoomOut:["zoomOut","ZOOM_OUT",t$1],zoomIn:["zoomIn","ZOOM_IN",M$1],toggleFull:["toggleFull","TOGGLE_FULL",M$1],iterateZoom:["iterateZoom","ITERATE_ZOOM",M$1],toggle1to1:["toggleFull","TOGGLE_FULL",'<path d="M3.51 3.07c5.74.02 11.48-.02 17.22.02 1.37.1 2.34 1.64 2.18 3.13 0 4.08.02 8.16 0 12.23-.1 1.54-1.47 2.64-2.79 2.46-5.61-.01-11.24.02-16.86-.01-1.36-.12-2.33-1.65-2.17-3.14 0-4.07-.02-8.16 0-12.23.1-1.36 1.22-2.48 2.42-2.46Z"/><path d="M5.65 8.54h1.49v6.92m8.94-6.92h1.49v6.92M11.5 9.4v.02m0 5.18v0"/>'],rotateCCW:["rotateCCW","ROTATE_CCW",'<path d="M15 4.55a8 8 0 0 0-6 14.9M9 15v5H4M18.37 7.16v.01M13 19.94v.01M16.84 18.37v.01M19.37 15.1v.01M19.94 11v.01"/>'],rotateCW:["rotateCW","ROTATE_CW",'<path d="M9 4.55a8 8 0 0 1 6 14.9M15 15v5h5M5.63 7.16v.01M4.06 11v.01M4.63 15.1v.01M7.16 18.37v.01M11 19.94v.01"/>'],flipX:["flipX","FLIP_X",'<path d="M12 3v18M16 7v10h5L16 7M8 7v10H3L8 7"/>'],flipY:["flipY","FLIP_Y",'<path d="M3 12h18M7 16h10L7 21v-5M7 8h10L7 3v5"/>'],reset:["reset","RESET",'<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>'],toggleFS:["toggleFS","TOGGLE_FS",'<g><path d="M14.5 9.5 21 3m0 0h-6m6 0v6M3 21l6.5-6.5M3 21v-6m0 6h6"/></g><g><path d="m14 10 7-7m-7 7h6m-6 0V4M3 21l7-7m0 0v6m0-6H4"/></g>']},v$1={};for(const t of Object.keys(o$3)){const M=o$3[t];v$1[t]={tpl:`<button data-panzoom-action="${M[0]}" class="f-button" title="{{${M[1]}}}"><svg>${M[2]}</svg></button>`};}

/*! License details at fancyapps.com/license */
var a$2;!function(t){t.Left="left",t.middle="middle",t.right="right";}(a$2||(a$2={}));const r$1=Object.assign({counter:{tpl:'<div class="f-counter"><span data-carousel-page></span>/<span data-carousel-pages></span></div>'},download:{tpl:'<button data-carousel-download class="f-button" title="{{DOWNLOAD}}"><svg><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"/></svg></button>'},autoplay:{tpl:'<button data-autoplay-action="toggle" class="f-button" title="{{TOGGLE_AUTOPLAY}}"><svg><g><path d="M5 3.5 19 12 5 20.5Z"/></g><g><path d="M8 4v15M17 4v15"/></g></svg></button>'},thumbs:{tpl:'<button data-thumbs-action="toggle" class="f-button" title="{{TOGGLE_THUMBS}}"><svg><rect width="18" height="14" x="3" y="3" rx="2"/><path d="M4 21h1M9 21h1M14 21h1M19 21h1"/></svg></button>'}},v$1),u$2={absolute:false,display:{left:[],middle:["zoomIn","zoomOut","toggle1to1","rotateCCW","rotateCW","flipX","flipY","reset"],right:[]},enabled:"auto",items:{}},c$2=()=>{let a,c;function d(e){const o=null==a?void 0:a.getOptions().Toolbar;let n=(t$5(o)?Object.assign(Object.assign({},u$2),o):u$2)[e];return n&&"function"==typeof n&&a?n(a):n}function f(){var s;if(!a||c)return;if(false===(null==a?void 0:a.getOptions().Toolbar))return;const u=a.getContainer();if(!u)return;let f=d("enabled");if(!f)return;const p=d("absolute"),g=a.getSlides().length>1;let b=false,m=false;for(const t of a.getSlides())t.panzoomRef&&(b=true),(t.downloadSrc||"image"===t.type&&t.src)&&(m=true);const v=(null===(s=a.getPlugins().Thumbs)||void 0===s?void 0:s.isEnabled())||false,h=g&&a.getPlugins().Autoplay||false,j=a.getPlugins().Fullscreen&&(document.fullscreenEnabled||document.webkitFullscreenEnabled);if("auto"===f&&(f=b),!f)return;c=u.querySelector(".f-carousel__toolbar")||void 0,c||(c=document.createElement("div"),s$7(c,"f-carousel__toolbar"));const E=d("display"),y=r$3({},r$1,d("items"));for(const l of ["left","middle","right"]){const s=E[l]||[],r=document.createElement("div");s$7(r,`f-carousel__toolbar__column is-${l}`);for(const l of s){let i;if(t$7(l)){if("counter"===l&&!g)continue;if("autoplay"===l&&!h)continue;if(v$1[l]&&!b)continue;if("fullscreen"===l&&!j)continue;if("thumbs"===l&&!v)continue;if("download"===l&&!m)continue;i=y[l];}if(t$5(l)&&(i=l),i&&i.tpl){let t=a.localize(i.tpl);t=t.split("<svg>").join('<svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24">');const e=e$7(t);e&&("function"==typeof i.click&&a&&e.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),"function"==typeof i.click&&a&&i.click(a,t);}),r.append(e));}}c.append(r);}if(c.childElementCount){if(p&&s$7(c,"is-absolute"),!c.parentElement){const t=d("parentEl");t?t.insertAdjacentElement("afterbegin",c):u.insertAdjacentElement("afterbegin",c);}u.contains(c)&&(s$7(u,"has-toolbar"),p&&s$7(u,"has-absolute-toolbar"));}}return {init:function(t){a=t,null==a||a.on("initSlides",f);},destroy:function(){null==a||a.off("initSlides",f),s$6(null==a?void 0:a.getContainer(),"has-toolbar has-absolute-toolbar"),null==c||c.remove(),c=void 0;},add:function(t,e){r$1[t]=e;},isEnabled:function(){return !!c}}};

/*! License details at fancyapps.com/license */
const n$3={autoStart:true,pauseOnHover:true,showProgressbar:true,timeout:2e3},o$2=()=>{let o,i,a=false,s=false,l=false,r=null;function u(e){const i=null==o?void 0:o.getOptions().Autoplay;let a=(t$5(i)?Object.assign(Object.assign({},n$3),i):n$3)[e];return a&&"function"==typeof a&&o?a(o):a}function f(){clearTimeout(i),i=void 0;}function g(){if(!o||!a||l||s||i||!o.isSettled()||function(){var t;const e=(null===(t=null==o?void 0:o.getPage())||void 0===t?void 0:t.slides)||[];for(const t of e)if(0===t.state)return  true;return  false}())return;!function(){var t,n,i,a;if(!o)return;if(v(),!u("showProgressbar"))return;let s=u("progressbarParentEl");!s&&(null===(t=o.getPlugins().Toolbar)||void 0===t?void 0:t.isEnabled())&&(s=o.getContainer());if(!s&&true!==(null===(n=o.getPlugins().Toolbar)||void 0===n?void 0:n.isEnabled())){const t=(null===(i=o.getPages()[0])||void 0===i?void 0:i.slides)||[],e=(null===(a=o.getPage())||void 0===a?void 0:a.slides)||[];1===t.length&&1===e.length&&(s=e[0].el);}s||(s=o.getViewport());if(!s)return;r=document.createElement("div"),s$7(r,"f-progressbar"),s.prepend(r);const l=u("timeout")||1e3;r.style.animationDuration=`${l}ms`;}();const t=u("timeout");i=setTimeout(()=>{o&&a&&!s&&(o.isInfinite()||o.getPageIndex()!==o.getPages().length-1?o.next():o.goTo(0));},t);}function c(){var t;if(!o||o.getPages().length<2||false===o.getOptions().Autoplay)return;if(a)return;a=true,o.emit("autoplay:start",u("timeout")),s$7(o.getContainer(),"has-autoplay"),null===(t=o.getTween())||void 0===t||t.on("start",b);const n=null==o?void 0:o.getContainer();n&&u("pauseOnHover")&&matchMedia("(hover: hover)").matches&&(n.addEventListener("mouseenter",E,false),n.addEventListener("mouseleave",w,false)),o.on("change",P),o.on("settle",y),o.on("contentReady",p),o.on("panzoom:touchStart",d),o.on("panzoom:wheel",d),o.isSettled()&&g();}function d(){var t;if(f(),v(),o){if(a){o.emit("autoplay:end"),null===(t=o.getTween())||void 0===t||t.off("start",b);const e=o.getContainer();e&&(e.classList.remove("has-autoplay"),e.removeEventListener("mouseenter",E,false),e.removeEventListener("mouseleave",w,false));}o.off("change",P),o.off("settle",y),o.off("contentReady",p),o.off("panzoom:touchStart",d),o.off("panzoom:wheel",d);}a=false,s=false;}function v(){r&&(r.remove(),r=null);}function m(){o&&o.getPages().length>1&&u("autoStart")&&c();}function p(){g();}function h(t,e){const n=e.target;n&&!e.defaultPrevented&&"toggle"===n.dataset.autoplayAction&&O.toggle();}function P(){!o||!(null==o?void 0:o.isInfinite())&&o.getPageIndex()===o.getPages().length-1?d():(f(),v());}function y(){g();}function b(){f(),v();}function E(){l=true,a&&(f(),v());}function w(){l=false,a&&!s&&(null==o?void 0:o.isSettled())&&g();}const O={init:function(t){o=t,o.on("ready",m),o.on("click",h);},destroy:function(){d(),null==o||o.off("ready",m),null==o||o.off("click",h),o=void 0;},isEnabled:()=>a,pause:function(){s=true,f(),v();},resume:function(){s=false,a&&!l&&g();},start(){c();},stop(){d();},toggle(){a?d():c();}};return O};

/*! License details at fancyapps.com/license */
const u$1={Carousel:{Lazyload:{showLoading:false}},minCount:2,showOnStart:true,thumbTpl:'<button aria-label="Slide to #{{page}}"><img draggable="false" alt="{{alt}}" data-lazy-src="{{src}}" /></button>',type:"modern"};let a$1;const c$1=()=>{let c,d,f,m,g,h=0,v=0,p=true;function b(e){const n=null==c?void 0:c.getOptions().Thumbs;let o=(t$5(n)?Object.assign(Object.assign({},u$1),n):u$1)[e];return o&&"function"==typeof o&&c?o(c):o}function y(){if(!c)return  false;if(false===(null==c?void 0:c.getOptions().Thumbs))return  false;let t=0;for(const e of c.getSlides())e.thumbSrc&&t++;return t>=b("minCount")}function x(){return "modern"===b("type")}function S(){return "scrollable"===b("type")}function C(){const t=[],e=(null==c?void 0:c.getSlides())||[];for(const n of e)t.push({index:n.index,class:n.thumbClass,html:T(n)});return t}function T(t){const e=t.thumb?t.thumb instanceof HTMLImageElement?t.thumb.src:t.thumb:t.thumbSrc||void 0,o=void 0===t.thumbAlt?`Thumbnail #${(t.index||0)+1}`:t.thumbAlt+"";let i=b("thumbTpl");return i=n$5(i,"{{alt}}",o),i=n$5(i,"{{src}}",e+""),i=n$5(i,"{{index}}",`${t.index||0}`),i=n$5(i,"{{page}}",`${(t.index||0)+1}`),i}function L(t){return `<div index="${t.index||0}" class="f-thumbs__slide ${t.class||""}">${t.html||""}</div>`}function E(t=false){var e;const n=null==c?void 0:c.getContainer();if(!c||!n||f||!y())return;const o=(null===(e=b("Carousel"))||void 0===e?void 0:e.classes)||{};if(o.container=o.container||"f-thumbs",!f){const t=n.nextElementSibling;(null==t?void 0:t.classList.contains(o.container))&&(f=t);}if(!f){f=document.createElement("div");const t=b("parentEl");t?t.insertAdjacentElement("beforeend",f):n.insertAdjacentElement("afterend",f);}s$7(f,o.container),s$7(f,"f-thumbs"),s$7(f,`is-${b("type")}`),t&&s$7(f,"is-hidden");}function P(){if(!f||!S())return;m=document.createElement("div"),s$7(m,"f-thumbs__viewport");let t="";for(const e of C()){"string"==typeof(e.html||"")&&(t+=L(e));}m.innerHTML=t,f.append(m),f.addEventListener("click",t=>{t.preventDefault();const e=t.target.closest("[index]"),n=parseInt((null==e?void 0:e.getAttribute("index"))||"-1");c&&n>-1&&c.goTo(n);}),g=new IntersectionObserver(t=>{t.forEach(t=>{t.isIntersecting&&t.target instanceof HTMLImageElement&&(t.target.src=t.target.getAttribute("data-lazy-src")+"",t.target.removeAttribute("data-lazy-src"),null==g||g.unobserve(t.target));});},{root:m,rootMargin:"100px"}),f.querySelectorAll("[data-lazy-src]").forEach(t=>{null==g||g.observe(t);}),null==c||c.emit("thumbs:ready");}function w(){var t;if(!a$1||!c||!f||S()||d)return;const n=C();if(!n.length)return;const o=r$3({},{Sync:{target:c},Lazyload:{preload:1},slides:n,classes:{container:"f-thumbs",viewport:"f-thumbs__viewport",slide:"f-thumbs__slide"},center:true,fill:!x(),infinite:false,dragFree:true,rtl:c.getOptions().rtl||false,slidesPerPage:t=>{let e=0;return x()&&(!function(){if(!x())return;if(!f)return;const t=t=>f&&parseFloat(getComputedStyle(f).getPropertyValue("--f-thumb-"+t))||0;h=t("width"),v=t("clip-width");}(),e=4*(h-v)),t&&t.getTotalSlideDim()<=t.getViewportDim()-e?1/0:1}},u$1.Carousel||{},b("Carousel")||{});d=a$1(f,o,{Sync:i$4,Lazyload:i$3}),d.on("ready",()=>{s$7(f,"is-syncing"),null==c||c.emit("thumbs:ready"),x()&&(null==c||c.on("render",$));}),d.on("destroy",()=>{null==c||c.emit("thumbs:destroy");}),d.init(),null===(t=d.getGestures())||void 0===t||t.on("start",()=>{p=false;}),d.on("click",(t,e)=>{const n=e.target;if(n){const t=n.matches("button")?n:n.firstElementChild;t&&t.matches("button")&&(e.preventDefault(),t.focus({preventScroll:true}));}}),s$7(c.getContainer(),"has-thumbs"),R();}function j(){y()&&b("showOnStart")&&(E(),P());}function A(){var t;y()&&(w(),null==c||c.on("addSlide",z),null==c||c.on("removeSlide",_),null==c||c.on("click",I),null==c||c.on("refresh",q),null===(t=null==c?void 0:c.getGestures())||void 0===t||t.on("start",M),D(true));}function M(){var t,e;p=true;(null===(t=document.activeElement)||void 0===t?void 0:t.closest(".f-thumbs"))&&(null===(e=document.activeElement)||void 0===e||e.blur());}function $(){var t,e;null==f||f.classList.toggle("is-syncing",false===(null==c?void 0:c.hasNavigated())||(null===(t=null==c?void 0:c.getTween())||void 0===t?void 0:t.isRunning())),R(),(null===(e=null==c?void 0:c.getGestures())||void 0===e?void 0:e.isPointerDown())&&function(){if(!x())return;if(!c||!d)return;if(!p)return;const t=d.getTween(),e=d.getPages(),n=c.getPageIndex()||0,i=c.getPageProgress()||0;if(!(c&&e&&e[n]&&t))return;const l=t.isRunning()?t.getCurrentValues().pos:d.getPosition();if(void 0===l)return;let r=e[n].pos+i*(h-v);r=t$6(e[0].pos,r,e[e.length-1].pos),t.from({pos:l}).to({pos:r}).start();}();}function O(){p=true,D();}function z(t,e){const n={html:T(e)};if(d)d.add(n,e.index);else if(m){const t=e$7(L(n));if(t){m.append(t);const e=t.querySelector("img");e&&(null==g||g.observe(e));}}}function _(t,e){var n;d?d.remove(e.index):m&&(null===(n=m.querySelector(`[index="${e.index}"]`))||void 0===n||n.remove());}function I(t,e){var n;const o=e.target;e.defaultPrevented||"toggle"!==(null===(n=null==o?void 0:o.dataset)||void 0===n?void 0:n.thumbsAction)||(f||(E(true),P(),w()),f&&f.classList.toggle("is-hidden"));}function q(){D();}function D(t=false){if(!c||!m||!S())return;const e=c.getPageIndex();m.querySelectorAll(".is-selected").forEach(t=>{t.classList.remove("is-selected");});const n=m.querySelector(`[index="${e}"]`);if(n){n.classList.add("is-selected");const e=m.getBoundingClientRect(),o=n.getBoundingClientRect(),i=n.offsetTop-m.offsetTop-.5*e.height+.5*o.height,l=n.scrollLeft-m.scrollLeft-.5*e.width+.5*o.width;m.scrollTo({top:i,left:l,behavior:t?"instant":"smooth"});}}function R(){if(!x())return;if(!c||!d)return;const t=(null==d?void 0:d.getSlides())||[];let e=-0.5*h;for(const n of t){const t=n.el;if(!t)continue;let o=c.getPageProgress(n.index)||0;o=Math.max(-1,Math.min(1,o)),o>-1&&o<1&&(e+=.5*h*(1-Math.abs(o))),o=Math.round(1e4*o)/1e4,e=Math.round(1e4*e)/1e4,t.style.setProperty("--progress",`${Math.abs(o)}`),t.style.setProperty("--shift",`${(null==c?void 0:c.isRTL())?-1*e:e}px`),o>-1&&o<1&&(e+=.5*h*(1-Math.abs(o)));}}return {init:function(t,e){a$1=e,c=t,c.on("ready",A),c.on("initSlides",j),c.on("change",O);},destroy:function(){var t,e;S()&&(null==c||c.emit("thumbs:destroy")),null==c||c.off("ready",A),null==c||c.off("initSlides",j),null==c||c.off("change",O),null==c||c.off("render",$),null==c||c.off("addSlide",z),null==c||c.off("click",I),null==c||c.off("refresh",q),null===(t=null==c?void 0:c.getGestures())||void 0===t||t.off("start",M),null===(e=null==c?void 0:c.getContainer())||void 0===e||e.classList.remove("has-thumbs"),c=void 0,null==d||d.destroy(),d=void 0,null==f||f.remove(),f=void 0;},getCarousel:function(){return d},getContainer:function(){return f},getType:function(){return b("type")},isEnabled:y}};

/*! License details at fancyapps.com/license */
const n$2={autosize:false,iframeAttr:{allow:"autoplay; fullscreen",scrolling:"auto"},preload:false},l$3=()=>{let l;function s(){const e=null==l?void 0:l.getOptions().Html;return t$5(e)?r$3({},n$2,e):n$2}function r(){return  false!==(null==l?void 0:l.getOptions().Html)}function d(t){return "iframe"===t.type||"pdf"===t.type||"gmap"===t.type}function c(t){const e=`${t}`;return e.match(/^\d+$/)?`${e}px`:e}function p(t){if(void 0===t||""===t)return;const e=`${t}`.trim();if(!e.match(/^\d+(\.\d+)?(px)?$/))return;const o=parseFloat(e);return Number.isFinite(o)?o:void 0}function h(t,e){var o;const i=null!==(o=t[e])&&void 0!==o?o:s()[e];return "true"===i||"false"!==i&&i}function m(t,o){if(!r())return;let i=o.type,a=o.src;if(!i&&t$7(a)){if("#"===a.charAt(0)?i="inline":a.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.((a)?png|avif|gif|jp(g|eg)|pjp(eg)?|jfif|svg|webp|bmp|ico|tif(f)?)((\?|#).*)?$)/i)?i="image":a.match(/\.(pdf)((\?|#).*)?$/i)?i="pdf":a.match(/\.(html|php)((\?|#).*)?$/i)&&(i="iframe"),!i){const t=a.match(/(?:maps\.)?google\.([a-z]{2,3}(?:\.[a-z]{2})?)\/(?:(?:(?:maps\/(?:place\/(?:.*)\/)?\@(.*),(\d+\.?\d+?)z))|(?:\?ll=))(.*)?/i);t&&(a=`https://maps.google.${t[1]}/?ll=${(t[2]?t[2]+"&z="+Math.floor(parseFloat(t[3]))+(t[4]?t[4].replace(/^\//,"&"):""):t[4]+"").replace(/\?/,"&")}&output=${t[4]&&t[4].indexOf("layer=c")>0?"svembed":"embed"}`,i="gmap");}if(!i){const t=a.match(/(?:maps\.)?google\.([a-z]{2,3}(?:\.[a-z]{2})?)\/(?:maps\/search\/)(.*)/i);t&&(a=`https://maps.google.${t[1]}/maps?q=${t[2].replace("query=","q=").replace("api=1","")}&output=embed`,i="gmap");}i&&(o.src=a,o.type=i);}}function f(t,e){r()&&d(e)&&function(t){const e=t.el,o=t.src;if(!l||!e||!o)return;const n=document.createElement("iframe");s$7(n,"f-iframe");for(const[t,e]of Object.entries(s().iframeAttr||{}))n.setAttribute(t,e);n.onerror=()=>{t.state=2,null==l||l.showError(t,"{{IFRAME_ERROR}}");};const r=document.createElement("div");s$7(r,"f-html"),r.append(n),t.htmlEl=r,t.contentEl=n,s$7(e,`has-html has-iframe has-${t.type}`),e.prepend(r),y(t);const d=h(t,"preload"),c=h(t,"autosize");"iframe"===t.type&&(d||c)?(t.state=0,l.showLoading(t),s$7(e,"is-loading"),n.onload=()=>{if(!l||2===l.getState()||!n.src.length||t.contentEl!==n||!n.isConnected)return;t.state=1;const o="true"!==n.dataset.ready;n.dataset.ready="true",v(t),l.hideLoading(t),o&&l.emit("contentReady",t),s$6(e,"is-loading");},n.src=`${o}`):(n.src=`${o}`,l.emit("contentReady",t));}(e);}function u(t,e){var o,i;if(d(e)){const t=e.el;null==l||l.hideError(e),null===(o=e.contentEl)||void 0===o||o.remove(),e.contentEl=void 0,null===(i=e.htmlEl)||void 0===i||i.remove(),e.htmlEl=void 0,t&&(s$6(t,"has-html has-iframe has-pdf has-gmap"),s$6(t,"is-loading"));}}function g(){for(const t of (null==l?void 0:l.getSlides())||[])d(t)&&(y(t),1===t.state&&v(t));}function y(t){const e=t.htmlEl;if(e&&d(t)&&(e.style.aspectRatio="",e.style.width="",e.style.height="",e.style.maxWidth="",e.style.maxHeight="",t.width&&(e.style.maxWidth=c(t.width)),t.height&&(e.style.maxHeight=c(t.height)),t.aspectRatio)){const o=t.aspectRatio.split("/"),i=parseFloat(o[0].trim()),a=o[1]?parseFloat(o[1].trim()):0,n=i&&a?i/a:i;e.offsetHeight;const l=e.getBoundingClientRect(),s=n<(l.width||1)/(l.height||1);e.style.aspectRatio=`${t.aspectRatio}`,e.style.width=s?"auto":"",e.style.height=s?"":"auto";}}function v(t){const e=t.contentEl,o=null==e?void 0:e.parentElement,i=null==o?void 0:o.style;let a=h(t,"autosize"),n=p(t.width)||0,l=p(t.height)||0;if(n&&l&&(a=false),e&&o&&i&&a){try{const t=window.getComputedStyle(o),a=parseFloat(t.paddingLeft)+parseFloat(t.paddingRight),s=parseFloat(t.paddingTop)+parseFloat(t.paddingBottom),r=e.contentWindow;if(r){const t=r.document,e=t.getElementsByTagName("html")[0],o=t.body;i.width="";const d=window.getComputedStyle(o),c=parseFloat(d.marginLeft)+parseFloat(d.marginRight),p=o.style.overflow||"";o.style.overflow="hidden",n=n||o.scrollWidth+c+a,i.flex="0 0 auto",i.width=`${n}px`,i.height=`${o.scrollHeight}px`,o.style.overflow=p;l=Math.max(e.scrollHeight,Math.ceil(e.getBoundingClientRect().height))+s;}}catch(t){}(n||l)&&Object.assign(i,{flex:"0 1 auto",width:n?`${n}px`:"",height:l?`${l}px`:""});}}return {init:function(t){l=t,l.on("addSlide",m),l.on("attachSlideEl",f),l.on("detachSlideEl",u),l.on("refresh",g);},destroy:function(){null==l||l.off("addSlide",m),null==l||l.off("attachSlideEl",f),null==l||l.off("detachSlideEl",u),null==l||l.off("refresh",g),l=void 0;}}};

/*! License details at fancyapps.com/license */
const i$1=(t,e={})=>{const o=new URL(t),n=new URLSearchParams(o.search),i=new URLSearchParams;for(const[t,o]of [...n,...Object.entries(e)]){let e=o+"";if("t"===t){let t=e.match(/((\d*)m)?(\d*)s?/);t&&i.set("start",60*parseInt(t[2]||"0")+parseInt(t[3]||"0")+"");}else i.set(t,e);}let l=i+"",s=t.match(/#t=((.*)?\d+s)/);return s&&(l+=`#t=${s[1]}`),l},l$2={autoplay:false,html5videoTpl:'<video class="f-html5video" playsinline controls controlsList="nodownload" poster="{{poster}}">\n    <source src="{{src}}" type="{{format}}" />Sorry, your browser doesn\'t support embedded videos.</video>',iframeAttr:{allow:"autoplay; fullscreen",scrolling:"no",referrerPolicy:"strict-origin-when-cross-origin",credentialless:""},vimeo:{byline:1,color:"00adef",controls:1,dnt:1,muted:0},youtube:{controls:1,enablejsapi:1,nocookie:1,rel:0,fs:1}},s$1=()=>{let s,r=false;function c(){const t=null==s?void 0:s.getOptions().Video;return t$5(t)?Object.assign(Object.assign({},l$2),t):l$2}function a(){var t;return null===(t=null==s?void 0:s.getPage())||void 0===t?void 0:t.slides[0]}const d=t=>{var e;try{let o=JSON.parse(t.data);if("https://player.vimeo.com"===t.origin){if("ready"===o.event)for(let o of Array.from((null===(e=null==s?void 0:s.getContainer())||void 0===e?void 0:e.getElementsByClassName("f-iframe"))||[]))o instanceof HTMLIFrameElement&&o.contentWindow===t.source&&(o.dataset.ready="true");}else if(t.origin.match(/^https:\/\/(www.)?youtube(-nocookie)?.com$/)&&"onReady"===o.event){const t=document.getElementById(o.id);t&&(t.dataset.ready="true");}}catch(t){}};function m(t,e){const n=e.src;if(!t$7(n))return;let l=e.type;if(!l||"html5video"===l){const t=n.match(/\.(mp4|mov|ogv|webm)((\?|#).*)?$/i);t&&(l="html5video",e.html5videoFormat=e.html5videoFormat||"video/"+("ogv"===t[1]?"ogg":t[1]));}if(!l||"youtube"===l){const t=n.match(/(youtube\.com|youtu\.be|youtube\-nocookie\.com)\/(?:watch\?(?:.*&)?v=|v\/|u\/|shorts\/|embed\/?)?(videoseries\?list=(?:.*)|[\w-]{11}|\?listType=(?:.*)&list=(?:.*))(?:.*)/i);if(t){const o=Object.assign(Object.assign({},c().youtube),e.youtube||{}),s=`www.youtube${o.nocookie?"-nocookie":""}.com`,r=i$1(n,o),a=encodeURIComponent(t[2]);e.videoId=a,e.src=`https://${s}/embed/${a}?${r}`,e.thumb=e.thumb||`https://i.ytimg.com/vi/${a}/mqdefault.jpg`,l="youtube";}}if(!l||"vimeo"===l){const t=n.match(/^.+vimeo.com\/(?:\/)?(video\/)?([\d]+)((\/|\?h=)([a-z0-9]+))?(.*)?/);if(t){const o=Object.assign(Object.assign({},c().vimeo),e.vimeo||{}),s=i$1(n,o),r=encodeURIComponent(t[2]),a=t[5]||"";e.videoId=r,e.src=`https://player.vimeo.com/video/${r}?${a?`h=${a}${s?"&":""}`:""}${s}`,l="vimeo";}}e.type=l;}function u(e,i){"html5video"===i.type&&function(e){const i=e.el,l=e.src;if(!s||!i||!l)return;const r=e.html5videoTpl||c().html5videoTpl,a=e.html5videoFormat||c().html5videoFormat;if(!r)return;const d=e.poster||(e.thumb&&t$7(e.thumb)?e.thumb:""),m=e$7(r.replace(/\{\{src\}\}/gi,l+"").replace(/\{\{format\}\}/gi,a||"").replace(/\{\{poster\}\}/gi,d+""));if(!m)return;const u=document.createElement("div");s$7(u,"f-html"),u.append(m),e.contentEl=m,e.htmlEl=u,s$7(i,`has-${e.type}`),i.prepend(u),v(e),s.emit("contentReady",e);}(i),"youtube"!==i.type&&"vimeo"!==i.type||function(e){const o=e.el,n=e.src;if(!s||!o||!n)return;const i=document.createElement("iframe");s$7(i,"f-iframe"),i.setAttribute("id",`f-iframe_${e.videoId}`);for(const[t,e]of Object.entries(c().iframeAttr||{}))i.setAttribute(t,e);"youtube"===e.type&&(i.onload=()=>{var t;1===(null==s?void 0:s.getState())&&(null===(t=i.contentWindow)||void 0===t||t.postMessage(JSON.stringify({event:"listening",id:i.getAttribute("id")}),"*"));}),i.onerror=()=>{null==s||s.showError(e,"{{IFRAME_ERROR}}");};const l=document.createElement("div");s$7(l,"f-html"),l.append(i),e.contentEl=i,e.htmlEl=l,s$7(o,`has-html has-iframe has-${e.type}`),i.src=`${e.src}`,o.prepend(l),v(e),s.emit("contentReady",e);}(i);}function f(t,e){var o,n;"html5video"!==e.type&&"youtube"!==e.type&&"vimeo"!==e.type||(null===(o=e.contentEl)||void 0===o||o.remove(),e.contentEl=void 0,null===(n=e.htmlEl)||void 0===n||n.remove(),e.htmlEl=void 0),e.poller&&clearTimeout(e.poller);}function p(){r=false;}function h(){if(r)return;r=true;const t=a();(t&&void 0!==t.autoplay?t.autoplay:c().autoplay)&&(function(){var t;const e=a(),o=null==e?void 0:e.el;if(o&&"html5video"===(null==e?void 0:e.type))try{const t=o.querySelector("video");if(t){const e=t.play();void 0!==e&&e.then(()=>{}).catch(e=>{t.muted=!0,t.play();});}}catch(t){}const n=null==e?void 0:e.htmlEl;n instanceof HTMLIFrameElement&&(null===(t=n.contentWindow)||void 0===t||t.postMessage('{"event":"command","func":"stopVideo","args":""}',"*"));}(),function(){const t=a(),e=null==t?void 0:t.type;if(!(null==t?void 0:t.el)||"youtube"!==e&&"vimeo"!==e)return;const o=()=>{if(t.contentEl&&t.contentEl instanceof HTMLIFrameElement&&t.contentEl.contentWindow){let e;if("true"===t.contentEl.dataset.ready)return e="youtube"===t.type?{event:"command",func:"playVideo"}:{method:"play",value:"true"},e&&t.contentEl.contentWindow.postMessage(JSON.stringify(e),"*"),void(t.poller=void 0);"youtube"===t.type&&(e={event:"listening",id:t.contentEl.getAttribute("id")},t.contentEl.contentWindow.postMessage(JSON.stringify(e),"*"));}t.poller=setTimeout(o,250);};o();}());}function v(t){const e=null==t?void 0:t.htmlEl;if(t&&e&&("html5video"===t.type||"youtube"===t.type||"vimeo"===t.type)){if(e.style.aspectRatio="",e.style.width="",e.style.height="",e.style.maxWidth="",e.style.maxHeight="",t.width){let o=`${t.width}`;o.match(/^\d+$/)&&(o+="px"),e.style.maxWidth=`${o}`;}if(t.height){let o=`${t.height}`;o.match(/^\d+$/)&&(o+="px"),e.style.maxHeight=`${o}`;}if(t.aspectRatio){const o=t.aspectRatio.split("/"),n=parseFloat(o[0].trim()),i=o[1]?parseFloat(o[1].trim()):0,l=n&&i?n/i:n;e.offsetHeight;const s=e.getBoundingClientRect(),r=l<(s.width||1)/(s.height||1);e.style.aspectRatio=`${t.aspectRatio}`,e.style.width=r?"auto":"",e.style.height=r?"":"auto";}}}function y(){v(a());}return {init:function(t){s=t,s.on("addSlide",m),s.on("attachSlideEl",u),s.on("detachSlideEl",f),s.on("ready",h),s.on("change",p),s.on("settle",h),s.on("refresh",y),window.addEventListener("message",d);},destroy:function(){null==s||s.off("addSlide",m),null==s||s.off("attachSlideEl",u),null==s||s.off("detachSlideEl",f),null==s||s.off("ready",h),null==s||s.off("change",p),null==s||s.off("settle",h),null==s||s.off("refresh",y),window.removeEventListener("message",d),s=void 0;}}};

/*! License details at fancyapps.com/license */
const n$1={autoStart:false,btnTpl:'<button data-fullscreen-action="toggle" class="f-button" title="{{TOGGLE_FULLSCREEN}}"><svg><g><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></g><g><path d="M15 19v-2a2 2 0 0 1 2-2h2M15 5v2a2 2 0 0 0 2 2h2M5 15h2a2 2 0 0 1 2 2v2M5 9h2a2 2 0 0 0 2-2V5"/></g></svg></button>'},t="in-fullscreen-mode",l$1=()=>{let l;function u(t){const u=null==l?void 0:l.getOptions().Fullscreen;let o=(t$5(u)?Object.assign(Object.assign({},n$1),u):n$1)[t];return o&&"function"==typeof o&&l?o(l):o}function o(){var e;null===(e=null==l?void 0:l.getPlugins().Toolbar)||void 0===e||e.add("fullscreen",{tpl:u("btnTpl")});}function c(){if(u("autoStart")){const e=s();e&&a(e);}}function i(e,n){const t=n.target;t&&!n.defaultPrevented&&"toggle"===t.dataset.fullscreenAction&&d();}function s(){return u("el")||(null==l?void 0:l.getContainer())||void 0}function r(){const e=document;return e.fullscreenEnabled?!!e.fullscreenElement:!!e.webkitFullscreenEnabled&&!!e.webkitFullscreenElement}function a(e){const n=document;let l;return e||(e=n.documentElement),n.fullscreenEnabled?l=e.requestFullscreen():n.webkitFullscreenEnabled&&(l=e.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)),l&&l.then(()=>{e.classList.add(t);}),l}function f(){const e=document;let n;return e.fullscreenEnabled?n=e.fullscreenElement&&e.exitFullscreen():e.webkitFullscreenEnabled&&(n=e.webkitFullscreenElement&&e.webkitExitFullscreen()),n&&n.then(()=>{var e;null===(e=s())||void 0===e||e.classList.remove(t);}),n}function d(){if(r())f();else {const e=s();e&&a(e);}}return {init:function(e){l=e,l.on("initPlugins",o),l.on("ready",c),l.on("click",i);},destroy:function(){null==l||l.off("initPlugins",o),null==l||l.off("ready",c),null==l||l.off("click",i);},exit:f,inFullscreen:r,request:a,toggle:d}};

/*! License details at fancyapps.com/license */
let n,o$1,r=false,i=false,l=false,s=false;const a=()=>{const t=new URL(document.URL).hash,e=t.slice(1).split("-"),n=e[e.length-1],o=n&&/^\+?\d+$/.test(n)&&parseInt(e.pop()||"1",10)||1;return {urlHash:t,urlSlug:e.join("-"),urlIndex:o}},u=()=>{const t=null==n?void 0:n.getInstance(),e=null==t?void 0:t.getState();return !(!t||0!==e&&1!==e)},c=()=>{if(!n)return;if(u())return;const{urlSlug:t,urlIndex:e}=a();if(!t)return;let o=document.querySelector(`[data-slug="${t}"]`);o&&n.fromTriggerEl(o),u()||(o=document.querySelectorAll(`[data-fancybox="${t}"]`)[e-1],o&&n.fromTriggerEl(o,{startIndex:e-1})),u()&&o&&!o.closest("[inert]")&&o.scrollIntoView({behavior:"instant",block:"center",inline:"center"});},d=t=>{const n=t.getOptions().Hash,o=t.getSlide();return o&&(o.slug||o.fancybox||(t$5(n)?n.slug:""))||""},g=t=>{var e,n;const o=d(t),r=t.getSlide();if(!r||!o)return "";let i=parseInt(r.index+"",10)+1,l=r.slug?`#${r.slug}`:`#${o}-${i}`;return ((null===(n=null===(e=t.getCarousel())||void 0===e?void 0:e.getPages())||void 0===n?void 0:n.length)||0)<2&&(l=`#${o}`),l},f=()=>{if(!n)return;if(l)return;const t=null==n?void 0:n.getInstance(),o=null==t?void 0:t.getCarousel(),{urlSlug:r,urlIndex:u}=a(),d=null==t?void 0:t.getOptions().Hash;if(false!==d){if(t&&1===t.getState()&&o){const n=o.getSlides();for(const t of n||[])if(t.slug===r||(t.fancybox===r||t$5(d)&&d.slug===r)&&t.index===u-1)return i=false,void o.goTo(t.index);s=true,t.close(),s=false;}c();}},h=()=>{n&&(o$1=setTimeout(()=>{r=true,c(),r=false;},300),window.addEventListener("hashchange",f,false));};let w;function v(){history.scrollRestoration&&w&&(history.scrollRestoration=w,w=void 0);}const m=()=>{let t,e="";function u(){var n;if(!t||!t.isTopMost()||false===t.getOptions().Hash)return;if(r){const e=t.getOptions().sync;e&&e.goTo((null===(n=null==t?void 0:t.getCarousel())||void 0===n?void 0:n.getPageIndex())||0,{transition:false,tween:false});}const o=t.getCarousel();if(!o)return;if(!t.getSlide())return;const l=d(t);if(!l)return;const{urlHash:s,urlSlug:u}=a(),f=g(t);s!==f&&(e=s),history.scrollRestoration&&!w&&(w=history.scrollRestoration,history.scrollRestoration="manual",window.addEventListener("beforeunload",v)),o.on("change",c);const h=l!==u;try{window.history[h?"pushState":"replaceState"]({},document.title,window.location.pathname+window.location.search+f),h&&(i=!0);}catch(t){}}function c(){if(!t||!t.isTopMost()||false===t.getOptions().Hash)return;if(!t.getSlide())return;if(!d(t))return;const e=g(t);l=true;try{window.history.replaceState({},document.title,window.location.pathname+window.location.search+e);}catch(t){}l=false;}function f(){var n;if(!t||!t.isTopMost()||false===t.getOptions().Hash||s)return;if(d(t)){l=true;try{i&&!function(){if(window.parent===window)return !1;try{var t=window.frameElement;}catch(e){t=null;}return null===t?"data:"===location.protocol:t.hasAttribute("sandbox")}()&&"IFRAME"!==(null===(n=document.activeElement)||void 0===n?void 0:n.nodeName)?window.history.back():window.history.replaceState({},document.title,window.location.pathname+window.location.search+e);}catch(t){}l=false;}}return {init:function(e){clearTimeout(o$1),t=e,t.on("ready",u),t.on("close",f);},destroy:function(){null==t||t.off("ready",u),null==t||t.off("close",f);const e=null==t?void 0:t.getCarousel();e&&e.off("change",c),t=void 0,(null==n?void 0:n.getInstance())||(v(),window.removeEventListener("beforeunload",v));}}};m.getInfoFromURL=a,m.startFromUrl=c,m.setup=function(e){n||(n=e,e$1()&&(/complete|interactive|loaded/.test(document.readyState)?h():document.addEventListener("DOMContentLoaded",h)));};

/*! License details at fancyapps.com/license */
const o=Object.assign(Object.assign({},o$5),{CLOSE:"Close",NEXT:"Next",PREV:"Previous",MODAL:"You can close this modal content with the ESC key",ELEMENT_NOT_FOUND:"HTML Element Not Found",IFRAME_ERROR:"Error Loading Page",NO_CAPTION:"No Caption",TOGGLE_SIDEBAR:"Toggle sidebar"});

/*! License details at fancyapps.com/license */
const M='<button class="f-button" title="{{CLOSE}}" data-fancybox-close><svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24"><path d="M19.286 4.714 4.714 19.286M4.714 4.714l14.572 14.572" /></svg></button>';c$2().add("close",{tpl:M});const k=e=>{e.cancelable&&e.preventDefault();};const R=(e=null,t="",n)=>{if(!e||!e.parentElement||!t)return void(n&&n());O(e);const o=i=>{i.target===e&&e.dataset.animationName&&(e.removeEventListener("animationend",o),delete e.dataset.animationName,n&&n(),e.classList.remove(t));};e.dataset.animationName=t,e.addEventListener("animationend",o),s$7(e,t);},O=e=>{e&&e.dispatchEvent(new CustomEvent("animationend",{bubbles:false,cancelable:true,currentTarget:e}));};var _;!function(e){e[e.Init=0]="Init",e[e.Ready=1]="Ready",e[e.Closing=2]="Closing",e[e.Destroyed=3]="Destroyed";}(_||(_={}));const I={ajax:null,backdropClick:"close",Carousel:{},closeButton:"auto",closeButtonTpl:M,closeExisting:false,delegateEl:void 0,dragToClose:true,fadeEffect:true,groupAll:false,groupAttr:"data-fancybox",hideClass:"f-fadeOut",hideScrollbar:true,id:void 0,idle:false,keyboard:{Escape:"close",Delete:"close",Backspace:"close",PageUp:"next",PageDown:"prev",ArrowUp:"prev",ArrowDown:"next",ArrowRight:"next",ArrowLeft:"prev"},l10n:o,mainClass:"",mainStyle:{},mainTpl:'<dialog class="fancybox__dialog">\n    <div class="fancybox__container" tabindex="0" aria-label="{{MODAL}}">\n      <div class="fancybox__backdrop"></div>\n      <div class="fancybox__carousel"></div>\n    </div>\n  </dialog>',modal:true,on:{},parentEl:void 0,placeFocusBack:true,showClass:"f-zoomInUp",startIndex:0,sync:void 0,theme:"dark",triggerEl:void 0,triggerEvent:void 0,zoomEffect:true},z=new Map;let H=0;const B="with-fancybox",D=()=>{let r,T,A,M,D,q,N,V=_.Init,W=Object.assign({},I),$=-1,K={},U=[],X=false,G=true,Y=0;function Z(e,...t){let n=W[e];return n&&"function"==typeof n?n(Re,...t):n}function J(e,t=[]){const n=Z("l10n")||{};e=String(e).replace(/\{\{(\w+)\}\}/g,(e,t)=>n[t]||e);for(let n=0;n<t.length;n++)e=e.split(t[n][0]).join(t[n][1]);return e=e.replace(/\{\{(.*?)\}\}/g,(e,t)=>t)}const Q=new Map;function ee(e,...t){const n=[...Q.get(e)||[]];for(const[t,o]of Object.entries(W.on||{}))(t===e||t.split(" ").indexOf(e)>-1)&&n.push(o);for(const e of n)e&&"function"==typeof e&&e(Re,...t);"*"!==e&&ee("*",e,...t);}function te(){s$6(T,"is-revealing");try{if(document.activeElement===r){((null==T?void 0:T.querySelector("[autofocus]"))||T).focus();}}catch(e){}}function ne(e,n){var o;ve(n),de(),null===(o=n.el)||void 0===o||o.addEventListener("click",ie),"inline"!==n.type&&"clone"!==n.type||function(e){if(!M||!e||!e.el)return;let n=null;if(t$7(e.src)){const t=e.src.split("#",2).pop();n=t?document.getElementById(t):null;}if(n){if(s$7(n,"f-html"),"clone"===e.type||n.closest(".fancybox__carousel")){n=n.cloneNode(true);const t=n.dataset.animationName;t&&(n.classList.remove(t),delete n.dataset.animationName);let o=n.getAttribute("id");o=o?`${o}--clone`:`clone-${$}-${e.index}`,n.setAttribute("id",o);}else if(n.parentNode){const t=document.createElement("div");t.inert=true,n.parentNode.insertBefore(t,n),e.placeholderEl=t;}e.htmlEl=n,s$7(e.el,"has-html"),e.el.prepend(n),n.classList.remove("hidden"),"none"===n.style.display&&(n.style.display=""),"none"===getComputedStyle(n).getPropertyValue("display")&&(n.style.display=n.dataset.display||"flex"),null==M||M.emit("contentReady",e);}else null==M||M.showError(e,"{{ELEMENT_NOT_FOUND}}");}(n),"ajax"===n.type&&function(e){const t=e.el;if(!t)return;if(e.htmlEl||e.xhr)return;null==M||M.showLoading(e),e.state=0;const n=new XMLHttpRequest;n.onreadystatechange=function(){if(n.readyState===XMLHttpRequest.DONE&&V===_.Ready)if(null==M||M.hideLoading(e),e.state=1,200===n.status){let o=n.responseText+"",i=null,s=null;if(e.filter){const t=document.createElement("div");t.innerHTML=o,s=t.querySelector(e.filter+"");}s&&s instanceof HTMLElement?i=s:(i=document.createElement("div"),i.innerHTML=o),i.classList.add("f-html"),e.htmlEl=i,t.classList.add("has-html"),t.classList.add("has-ajax"),t.prepend(i),null==M||M.emit("contentReady",e);}else null==M||M.showError(e);};const o=Z("ajax")||null;n.open(o?"POST":"GET",e.src+""),n.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),n.setRequestHeader("X-Requested-With","XMLHttpRequest"),n.send(o),e.xhr=n;}(n);}function oe(e,t){var n;ye(t),null===(n=t.el)||void 0===n||n.removeEventListener("click",ie),"inline"!==t.type&&"clone"!==t.type||function(e){const t=e.htmlEl,n=e.placeholderEl;t&&("none"!==getComputedStyle(t).getPropertyValue("display")&&(t.style.display="none"),t.offsetHeight);n&&(t&&n.parentNode&&n.parentNode.insertBefore(t,n),n.remove());e.htmlEl=void 0,e.placeholderEl=void 0;}(t),t.xhr&&(t.xhr.abort(),t.xhr=void 0);}function ie(e){if(!he())return;if(V!==_.Ready)return k(e),void e.stopPropagation();if(e.defaultPrevented)return;if(!f$1.isClickAllowed())return;const t=e.composedPath()[0];t.closest(".fancybox__carousel")&&t.classList.contains("fancybox__slide")&&fe(e);}function se(){G=false,T&&M&&T.classList.remove("is-revealing"),de();const e=Z("sync");if(M&&e){const t=e.getPageIndex(M.getPageIndex())||0;e.goTo(t,{transition:false,tween:false});}}function le(){var e;!function(){const e=null==M?void 0:M.getViewport();if(!Z("dragToClose")||!M||!e)return;if(D=f$1(e).init(),!D)return;let t=false,n=0,o=0,s={},l=1;function r(){var e,t;null==q||q.spring({clamp:true,mass:1,tension:0===o?140:960,friction:17,restDelta:.1,restSpeed:.1,maxSpeed:1/0}).from({y:n}).to({y:o}).start();const i=(null===(e=null==M?void 0:M.getViewport())||void 0===e?void 0:e.getBoundingClientRect().height)||0,s=null===(t=Ee())||void 0===t?void 0:t.panzoomRef;if(i&&s)if(0===o)s.execute(v$2.Reset);else {const e=t$3(Math.abs(n),0,.33*i,l,.77*l,false);s.execute(v$2.ZoomTo,{scale:e});}}const c=e=>{var t;const n=e.srcEvent,o=n.target;return M&&!(e$4(n)&&(null===(t=n.touches)||void 0===t?void 0:t.length)>1)&&o&&!n$8(o)};q=c$4().on("step",t=>{if(T&&e&&V===_.Ready){const o=e.getBoundingClientRect().height;n=Math.min(o,Math.max(-1*o,t.y));const i=t$3(Math.abs(n),0,.65*o,1,.2,true);T.style.setProperty("--f-drag-opacity",i+""),T.style.setProperty("--f-drag-offset",n+"px");}}),D.on("start",function(){t||(null==q||q.pause(),o=n);}).on("panstart",e=>{var n,o;if(!t&&c(e)&&"y"===e.axis){k(e.srcEvent),t=true,Te(),null===(n=null==M?void 0:M.getViewport())||void 0===n||n.classList.add("is-dragging");const i=null===(o=Ee())||void 0===o?void 0:o.panzoomRef;if(i){l=i.getTransform().scale||1;const e=i.getOptions();s=Object.assign({},e),e.bounds=false,e.gestures=false;}}else t=false;}).on("pan",function(e){t&&c(e)&&(k(e.srcEvent),e.srcEvent.stopPropagation(),"y"===e.axis&&(o+=e.deltaY,r()));}).on("end",e=>{var i,l,a;if(null===(i=null==M?void 0:M.getViewport())||void 0===i||i.classList.remove("is-dragging"),t){const t=null===(l=Ee())||void 0===l?void 0:l.panzoomRef;if(t){null===(a=t.getTween())||void 0===a||a.end();const e=t.getOptions();e.bounds=s.bounds||false,e.gestures=s.gestures||false;}c(e)&&"y"===e.axis&&(Math.abs(e.velocityY)>5||Math.abs(n)>50)&&Ae(e.srcEvent,"f-throwOut"+(e.velocityY>0?"Down":"Up"));}t=false,V===_.Ready&&0!==n&&(o=0,r());});}(),document.body.addEventListener("click",pe),document.body.addEventListener("keydown",ge,{passive:false,capture:true}),de(),Le();const t=Z("sync");M&&t&&(null===(e=t.getTween())||void 0===e||e.start()),be(Ee());}function re(){(null==M?void 0:M.canGoNext())?Le():Pe();}function ae(e,t){ve(t);}function ce(e,t){ve(t),be(t);}function ue(){var e;const t=null==M?void 0:M.getPlugins().Thumbs;s$5(T,"has-thumbs",(null==t?void 0:t.isEnabled())||false),s$5(T,"has-vertical-thumbs",!!t&&("scrollable"===t.getType()||true===(null===(e=t.getCarousel())||void 0===e?void 0:e.isVertical())));}function de(){if(!T)return;const e=(null==M?void 0:M.getPages().length)||0,t=(null==M?void 0:M.getPageIndex())||0,n=T.querySelectorAll("[data-fancybox-index],[data-fancybox-page],[data-fancybox-pages]");for(const o of n)o.hasAttribute("data-fancybox-index")?o.textContent=String(t):o.hasAttribute("data-fancybox-page")?o.textContent=String(t+1):o.textContent=String(e);}function fe(e){if(!!e.composedPath()[0].closest("[data-fancybox-close]"))return void Ae(e);if(ee("backdropClick",e),e.defaultPrevented)return;Z("backdropClick")&&Ae(e);}function me(){Ce();}function ge(e){if(!he())return;if(V!==_.Ready)return;const t=e.key,o=Z("keyboard");if(!o)return;if(e.ctrlKey||e.altKey||e.shiftKey)return;const i=e.composedPath()[0];if(!n$9(i))return;if("Escape"!==t&&(e=>{const t=["input","textarea","select","option","video","iframe","[contenteditable]","[data-selectable]","[data-draggable]"].join(",");return e.matches(t)||e.closest(t)})(i))return;if(ee("keydown",e),e.defaultPrevented)return;const s=o[t];if(s)switch(s){case "close":Ae(e);break;case "next":k(e),null==M||M.next();break;case "prev":k(e),null==M||M.prev();}}function pe(e){if(!he())return;if(V!==_.Ready)return;if(Ce(),e.defaultPrevented)return;const t=e.composedPath()[0],n=!!t.closest("[data-fancybox-close]"),o=t.classList.contains("fancybox__backdrop");(n||o)&&fe(e);}function ve(e){var t;const{el:n,htmlEl:i,panzoomRef:s,closeButtonEl:l}=e,r=s?s.getWrapper():i;if(!n||!n.parentElement||!r)return;let a=Z("closeButton");if("auto"===a&&(a=true!==(null===(t=null==M?void 0:M.getPlugins().Toolbar)||void 0===t?void 0:t.isEnabled())),a){if(!l){const t=e$7(J(Z("closeButtonTpl")));t&&(s$7(t,"is-close-button"),e.closeButtonEl=r.insertAdjacentElement("afterbegin",t),s$7(n,"has-close-btn"));}}else ye(e);}function ye(e){e.closeButtonEl&&(e.closeButtonEl.remove(),e.closeButtonEl=void 0),s$6(e.el,"has-close-btn");}function be(e){if(!(G&&M&&1===M.getState()&&e&&e.index===M.getOptions().initialPage&&e.el&&e.el.parentElement))return;if(void 0!==e.state&&1!==e.state)return;G=false;const t=e.panzoomRef,n=null==t?void 0:t.getTween(),o=Z("zoomEffect")&&n?we(e):void 0;if(t&&n&&o){const{x:e,y:i,scale:s}=t.getStartPosition();return void n.spring({tension:215,friction:25,restDelta:.001,restSpeed:.001,maxSpeed:1/0}).from(o).to({x:e,y:i,scale:s}).start()}const i=(null==t?void 0:t.getContent())||e.htmlEl;i&&R(i,Z("showClass",e));}function he(){var e;return (null===(e=F.getInstance())||void 0===e?void 0:e.getId())===$}function Ee(){var e;return null===(e=null==M?void 0:M.getPage())||void 0===e?void 0:e.slides[0]}function xe(){const e=Ee();return e?e.triggerEl||Z("triggerEl"):void 0}function we(e){var t,n;const o=e.thumbEl;if(!o||!(e=>{const t=e.getBoundingClientRect(),n=e.closest("[style]"),o=null==n?void 0:n.parentElement;if(n&&n.style.transform&&o){const e=o.getBoundingClientRect();if(t.left<e.left||t.left>e.left+e.width-t.width)return  false;if(t.top<e.top||t.top>e.top+e.height-t.height)return  false}const i=Math.max(document.documentElement.clientHeight,window.innerHeight),s=Math.max(document.documentElement.clientWidth,window.innerWidth);return !(t.bottom<0||t.top-i>=0||t.right<0||t.left-s>=0)})(o))return;const i=null===(n=null===(t=e.panzoomRef)||void 0===t?void 0:t.getWrapper())||void 0===n?void 0:n.getBoundingClientRect(),s=null==i?void 0:i.width,l=null==i?void 0:i.height;if(!s||!l)return;const r=o.getBoundingClientRect();let a=r.width,c=r.height,u=r.left,d=r.top;if(!r||!a||!c)return;if(o instanceof HTMLImageElement){const e=window.getComputedStyle(o).getPropertyValue("object-fit");if("contain"===e||"scale-down"===e){const{width:t,height:n}=((e,t,n,o,i="contain")=>{if("contain"===i||e>n||t>o){const i=n/e,s=o/t,l=Math.min(i,s);e*=l,t*=l;}return {width:e,height:t}})(o.naturalWidth,o.naturalHeight,a,c,e);u+=.5*(a-t),d+=.5*(c-n),a=t,c=n;}}if(Math.abs(s/l-a/c)>.1)return;return {x:u+.5*a-(i.left+.5*s),y:d+.5*c-(i.top+.5*l),scale:a/s}}function je(){N&&clearTimeout(N),N=void 0,document.removeEventListener("mousemove",me);}function Le(){if(X)return;if(N)return;const e=Z("idle");e&&(N=setTimeout(Se,e));}function Se(){T&&(je(),s$7(T,"is-idle"),document.addEventListener("mousemove",me),X=true);}function Ce(){X&&(Pe(),Le());}function Pe(){je(),null==T||T.classList.remove("is-idle"),X=false;}function Te(){const e=xe();var t;!e||(t=e.getBoundingClientRect()).bottom>0&&t.right>0&&t.left<(window.innerWidth||document.documentElement.clientWidth)&&t.top<(window.innerHeight||document.documentElement.clientHeight)||e.closest("[inert]")||e.scrollIntoView({behavior:"instant",block:"center",inline:"center"});}function Ae(e,t){var n,o,i,s,r;if(V===_.Closing||V===_.Destroyed)return;const a=new Event("shouldClose",{bubbles:true,cancelable:true});if(ee("shouldClose",a,e),a.defaultPrevented)return;if(je(),e){if(e.defaultPrevented)return;k(e),e.stopPropagation(),e.stopImmediatePropagation();}if(V=_.Closing,null==q||q.pause(),null==D||D.destroy(),M){null===(n=M.getGestures())||void 0===n||n.destroy(),null===(o=M.getTween())||void 0===o||o.pause();for(const e of M.getSlides()){const t=e.panzoomRef;t&&(r$3(t.getOptions(),{clickAction:false,dblClickAction:false,wheelAction:false,bounds:false,minScale:0,maxScale:1/0}),null===(i=t.getGestures())||void 0===i||i.destroy(),null===(s=t.getTween())||void 0===s||s.pause());}}const c=null==M?void 0:M.getPlugins();null===(r=null==c?void 0:c.Autoplay)||void 0===r||r.stop();const u=null==c?void 0:c.Fullscreen;u&&u.inFullscreen()?Promise.resolve(u.exit()).then(()=>{setTimeout(()=>{Me(e,t);},150);}):Me(e,t);}function Me(e,t){var n,o;if(V!==_.Closing)return;ee("close",e),G=false,document.body.removeEventListener("click",pe),document.body.removeEventListener("keydown",ge,{passive:false,capture:true}),Z("placeFocusBack")&&Te();const i=document.activeElement;i&&(null==r?void 0:r.contains(i))&&i.blur(),Z("fadeEffect")&&(null==T||T.classList.remove("is-ready"),null==T||T.classList.add("is-hiding")),null==T||T.classList.add("is-closing");const s=Ee(),l=null==s?void 0:s.el,a=null==s?void 0:s.panzoomRef,c=null===(n=null==s?void 0:s.panzoomRef)||void 0===n?void 0:n.getTween(),u=t||Z("hideClass");let d=false,m=false;if(M&&s&&l&&a&&c){let e;if(Z("zoomEffect")&&1===s.state&&(e=we(s)),e){d=true;const t=()=>{e=we(s),e?c.to(Object.assign(Object.assign({},y$1),e)):ke();};a.on("refresh",()=>{t();}),c.easing(c$4.Easings.EaseOut).duration(350).from(Object.assign({},a.getTransform())).to(Object.assign(Object.assign({},y$1),e)).start(),(null==l?void 0:l.getAnimations())&&(l.style.animationPlayState="paused",requestAnimationFrame(()=>{t();}));}}const g=(null==s?void 0:s.htmlEl)||(null===(o=null==s?void 0:s.panzoomRef)||void 0===o?void 0:o.getWrapper());g&&O(g),!d&&u&&g&&(m=true,R(g,u,()=>{ke();})),d||m?setTimeout(()=>{ke();},350):ke();}function ke(){var e,t,n,o,i;if(V===_.Destroyed)return;V=_.Destroyed;const l=xe();ee("destroy"),null===(t=null===(e=Z("sync"))||void 0===e?void 0:e.getPlugins().Autoplay)||void 0===t||t.resume(),null===(o=null===(n=Z("sync"))||void 0===n?void 0:n.getPlugins().Autoscroll)||void 0===o||o.resume(),r instanceof HTMLDialogElement&&r.close(),null===(i=null==M?void 0:M.getContainer())||void 0===i||i.classList.remove("is-idle"),null==M||M.destroy();for(const e of Object.values(K))null==e||e.destroy();if(K={},null==r||r.remove(),r=void 0,T=void 0,M=void 0,z.delete($),!z.size&&(t$2(false),document.documentElement.classList.remove(B),Z("placeFocusBack")&&l&&!l.closest("[inert]")))try{null==l||l.focus({preventScroll:!0});}catch(e){}}const Re={close:Ae,destroy:ke,getCarousel:function(){return M},getContainer:function(){return T},getId:function(){return $},getOptions:function(){return W},getPlugins:function(){return K},getSlide:function(){return Ee()},getState:function(){return V},init:function(t=[],n={}){V!==_.Init&&(Re.destroy(),V=_.Init),W=r$3({},I,n),$=Z("id")||"fancybox-"+ ++H;const a=z.get($);if(a&&a.destroy(),z.set($,Re),ee("init"),function(){for(const[e,t]of Object.entries(Object.assign(Object.assign({},F.Plugins),W.plugins||{})))if(e&&!K[e]&&t instanceof Function){const n=t();n.init(Re),K[e]=n;}ee("initPlugins");}(),function(e=[]){ee("initSlides",e),U=[...e];}(t),function(){const t=Z("parentEl")||document.body;if(!(t&&t instanceof HTMLElement))return;const n=J(Z("mainTpl")||"");if(r=e$7(n)||void 0,!r)return;if(T=r.querySelector(".fancybox__container"),!(T&&T instanceof HTMLElement))return;const l=Z("mainClass");l&&s$7(T,l);const a=Z("mainStyle");if(a&&t$5(a))for(const[e,t]of Object.entries(a))T.style.setProperty(e,t);const u=Z("theme"),d="auto"===u?window.matchMedia("(prefers-color-scheme:light)").matches:"light"===u;T.setAttribute("theme",d?"light":"dark"),r.setAttribute("id",`${$}`),r.addEventListener("keydown",e=>{"Escape"===e.key&&k(e);}),r.addEventListener("wheel",e=>{const t=e.target;let n=Z("wheel",e);t.closest(".f-thumbs")&&(n="slide");const o="slide"===n,s=[-e.deltaX||0,-e.deltaY||0,-e.detail||0].reduce(function(e,t){return Math.abs(t)>Math.abs(e)?t:e}),l=Math.max(-1,Math.min(1,s)),r=Date.now();Y&&r-Y<300?o&&k(e):(Y=r,ee("wheel",e,l),e.defaultPrevented||("close"===n?Ae(e):"slide"===n&&M&&!n$8(t)&&(k(e),M[l>0?"prev":"next"]())));},{capture:true,passive:false}),r.addEventListener("cancel",e=>{Ae(e);}),t.append(r),1===z.size&&(Z("hideScrollbar")&&t$2(true),document.documentElement.classList.add(B));ee("initLayout"),r instanceof HTMLDialogElement&&(Z("modal")?r.showModal():r.show());}(),function(){if(A=(null==r?void 0:r.querySelector(".fancybox__carousel"))||void 0,!A)return;A.fancybox=Re;const e=r$3({},{Autoplay:{autoStart:false,pauseOnHover:false,progressbarParentEl:e=>{const t=e.getContainer();return (null==t?void 0:t.querySelector(".f-carousel__toolbar [data-autoplay-action]"))||t}},Fullscreen:{el:T},Toolbar:{absolute:true,items:{counter:{tpl:'<div class="f-counter"><span data-fancybox-page></span>/<span data-fancybox-pages></span></div>'}},display:{left:["counter"],right:["toggleFull","autoplay","fullscreen","thumbs","close"]}},Video:{autoplay:true},Thumbs:{minCount:2,Carousel:{classes:{container:"fancybox__thumbs"}}},classes:{container:"fancybox__carousel",viewport:"fancybox__viewport",slide:"fancybox__slide"},spinnerTpl:'<div class="f-spinner" data-fancybox-close></div>',dragFree:false,slidesPerPage:1,plugins:{Sync:i$4,Arrows:l$4,Lazyload:i$3,Zoomable:s$4,Html:l$3,Video:s$1,Autoplay:o$2,Fullscreen:l$1,Thumbs:c$1,Toolbar:c$2}},Z("Carousel")||{},{slides:U,enabled:true,initialPage:Z("startIndex")||0,l10n:Z("l10n")});M=x(A,e),ee("initCarousel",M),M.on("*",(e,t,...n)=>{ee(`Carousel.${t}`,e,...n);}),M.on("attachSlideEl",ne),M.on("detachSlideEl",oe),M.on("contentLoading",ae),M.on("contentReady",ce),M.on("ready",le),M.on("change",se),M.on("settle",re),M.on("thumbs:ready",ue),M.on("thumbs:destroy",ue),M.init();}(),r&&T){if(Z("closeExisting"))for(const[e,t]of z.entries())e!==$&&t.close();Z("fadeEffect")?(setTimeout(()=>{te();},500),s$7(T,"is-revealing")):te(),T.classList.add("is-ready"),V=_.Ready,ee("ready");}},isCurrentSlide:function(e){const t=Ee();return !(!e||!t)&&t.index===e.index},isTopMost:function(){return he()},localize:J,off:function(e,t){return Q.has(e)&&Q.set(e,Q.get(e).filter(e=>e!==t)),Re},on:function(e,t){return Q.set(e,[...Q.get(e)||[],t]),Re},toggleIdle(e){(X||true===e)&&Se(),X&&false!==e||Pe();}};return Re};function q(){for(const e of Object.values(F.Plugins)){const t=e.setup;"function"==typeof t&&t(F);}}function N(e,t={}){var n,o,i;if(!(e&&e instanceof Element))return;let s,r,a,c,u={};for(const[t,n]of F.openers)if(t.contains(e))for(const[o,i]of n){let n;if(o){for(const i of t.querySelectorAll(o))if(i.contains(e)){n=i;break}if(!n)continue}for(const[o,d]of i){let i=null;try{i=e.closest(o);}catch(e){}i&&(r=t,a=n,s=i,c=o,r$3(u,d||{}));}}if(!r||!c||!s)return;const d=r$3({},I,t,u,{triggerEl:s});let f=[].slice.call((a||r).querySelectorAll(c));const m=s.closest(".f-carousel"),g=null==m?void 0:m.carousel;if(g&&(!a||!m.contains(a))){const e=[];for(const t of null==g?void 0:g.getSlides()){const n=t.el;n&&(n.matches(c)?e.push(n):e.push(...[].slice.call(n.querySelectorAll(c))));}e.length&&(f=[...e],null===(n=g.getPlugins().Autoplay)||void 0===n||n.pause(),null===(o=g.getPlugins().Autoscroll)||void 0===o||o.pause(),d.sync=g);}if(false===d.groupAll){const e=d.groupAttr,t=e&&s?s.getAttribute(`${e}`):"";f=e&&t&&"true"!==t?f.filter(n=>n.getAttribute(`${e}`)===t):[s];}if(!f.length)return;null===(i=d.triggerEvent)||void 0===i||i.preventDefault();const p=F.getInstance(),v=null==p?void 0:p.getState();if(p&&(v===_.Init||v===_.Ready)){const e=p.getOptions().triggerEl;if(e&&f.indexOf(e)>-1)return}return Object.assign({},d.Carousel||{}).rtl&&(f=f.reverse()),s&&void 0===t.startIndex&&(d.startIndex=f.indexOf(s)),F.fromNodes(f,d)}const F={Plugins:{Hash:m},version:"6.1.14",openers:new Map,bind:function(e,n,o,i){if(!e$1())return;let s=document.body,l=null,a="[data-fancybox]",c={};e instanceof Element&&(s=e),t$7(e)&&t$7(n)?(l=e,a=n):t$7(n)&&t$7(o)?(l=n,a=o):t$7(n)?a=n:t$7(e)&&(a=e),"object"==typeof n&&(c=n||{}),"object"==typeof o&&(c=o||{}),"object"==typeof i&&(c=i||{}),function(e,t,n,o={}){if(!(e&&e instanceof Element&&n))return;const i=F.openers.get(e)||new Map,s=i.get(t)||new Map;s.set(n,o),i.set(t,s),F.openers.set(e,i),1===i.size&&e.addEventListener("click",F.fromEvent),q();}(s,l,a,c);},close:function(e=true,...t){if(e)for(const e of z.values())e.close(...t);else {const e=F.getInstance();e&&e.close(...t);}},destroy:function(){let e;for(;e=F.getInstance();)e.destroy();for(const e of F.openers.keys())e.removeEventListener("click",F.fromEvent);F.openers.clear();},fromEvent:function(e){if(e.defaultPrevented)return;if(e.button&&0!==e.button)return;if(e.ctrlKey||e.metaKey||e.shiftKey)return;let t=e.composedPath()[0];const n={triggerEvent:e};if(t.closest(".fancybox__container.is-hiding"))return k(e),void e.stopPropagation();const o=t.closest("[data-fancybox-delegate]")||void 0;if(o){const e=o.dataset.fancyboxDelegate||"",i=document.querySelectorAll(`[data-fancybox="${e}"]`),s=parseInt(o.dataset.fancyboxIndex||"",10)||0;t=i[s]||i[0],r$3(n,{delegateEl:o,startIndex:s});}return N(t,n)},fromNodes:function(e,t){t=r$3({},I,t||{});const n=[],o=e=>e instanceof HTMLImageElement?e:e instanceof HTMLElement?e.querySelector("img:not([aria-hidden])"):void 0;for(const i of e){const s=i.dataset||{},l=t.delegateEl&&e.indexOf(i)===t.startIndex?t.delegateEl:void 0,r=o(l)||o(i)||void 0,a=s.src||i.getAttribute("href")||i.getAttribute("currentSrc")||i.getAttribute("src")||void 0,c=s.thumb||s.thumbSrc||(null==r?void 0:r.getAttribute("currentSrc"))||(null==r?void 0:r.getAttribute("src"))||(null==r?void 0:r.dataset.lazySrc)||void 0,u={src:a,alt:s.alt||(null==r?void 0:r.getAttribute("alt"))||void 0,thumbSrc:c,thumbEl:r,triggerEl:i,delegateEl:l};for(const e in s){let t=s[e]+"";u[e]="true"===t?"fancybox"!==e||"":"false"!==t&&t;}n.push(u);}return F.show(n,t)},fromSelector:function(e,n,o,i){if(!e$1())return;let s=document.body,l=null,a="[data-fancybox]",c={};e instanceof Element&&(s=e),t$7(e)&&t$7(n)?(l=e,a=n):t$7(n)&&t$7(o)?(l=n,a=o):t$7(n)?a=n:t$7(e)&&(a=e),"object"==typeof n&&(c=n||{}),"object"==typeof o&&(c=o||{}),"object"==typeof i&&(c=i||{});for(const[e,t]of F.openers)for(const[n,o]of t)for(const[t,i]of o)if(e===s&&n===l){const e=s.querySelector((n?`${n} `:"")+a);if(e&&e.matches(t))return F.fromTriggerEl(e,c)}},fromTriggerEl:N,getCarousel:function(){var e;return (null===(e=F.getInstance())||void 0===e?void 0:e.getCarousel())||void 0},getDefaults:function(){return I},getInstance:function(e){if(e){const t=z.get(e);return t&&t.getState()!==_.Destroyed?t:void 0}return Array.from(z.values()).reverse().find(e=>{if(e.getState()!==_.Destroyed)return e})||void 0},getSlide:function(){var e;return (null===(e=F.getInstance())||void 0===e?void 0:e.getSlide())||void 0},show:function(e=[],t={}){return q(),D().init(e,t)},unbind:function(e,n,o){if(!e$1())return;let i=document.body,s=null,l="[data-fancybox]";e instanceof Element&&(i=e),t$7(e)&&t$7(n)?(s=e,l=n):t$7(n)&&t$7(o)?(s=n,l=o):t$7(n)?l=n:t$7(e)&&(l=e),function(e,t,n){if(!(e&&e instanceof Element&&n))return;const o=F.openers.get(e)||new Map,i=o.get(t)||new Map;i&&n&&i.delete(n),i.size&&n||o.delete(t),o.size||(F.openers.delete(e),e.removeEventListener("click",F.fromEvent));}(i,s,l);}};

/*
	Fancybox
	https://fancyapps.com/docs/ui/fancybox/
*/

// Fancybox.defaults.dragToClose = false;
// Fancybox.defaults.Thumbs = false;
// Fancybox.defaults.infinite = false;
// Fancybox.defaults.template = {
// 	closeButton: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M17 7.81199L16.188 7L12 11.188L7.81199 7L7 7.81199L11.188 12L7 16.188L7.81199 17L12 12.812L16.188 17L17 16.188L12.812 12L17 7.81199Z" /></svg>`,
// };


function initFancybox() {
    F.bind('[data-fancybox]', {
          zoomEffect: false,
           backFocus: false,
    trapFocus: false,
    placeFocusBack: false,
        idle: false,
          Hash: false,

        Carousel: {

            Thumbs: {
                type: 'classic',
            },
            Toolbar: {
                display: {
                  left: [],
                  right: ['close'],
                },
            },
        }
    });
}

/**
 * SSR Window 5.0.1
 * Better handling for window object in SSR environment
 * https://github.com/nolimits4web/ssr-window
 *
 * Copyright 2025, Vladimir Kharlampidi
 *
 * Licensed under MIT
 *
 * Released on: June 27, 2025
 */
/* eslint-disable no-param-reassign */
function isObject$1(obj) {
  return obj !== null && typeof obj === 'object' && 'constructor' in obj && obj.constructor === Object;
}
function extend$1(target = {}, src = {}) {
  const noExtend = ['__proto__', 'constructor', 'prototype'];
  Object.keys(src).filter(key => noExtend.indexOf(key) < 0).forEach(key => {
    if (typeof target[key] === 'undefined') target[key] = src[key];else if (isObject$1(src[key]) && isObject$1(target[key]) && Object.keys(src[key]).length > 0) {
      extend$1(target[key], src[key]);
    }
  });
}
const ssrDocument = {
  body: {},
  addEventListener() {},
  removeEventListener() {},
  activeElement: {
    blur() {},
    nodeName: ''
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
  getElementById() {
    return null;
  },
  createEvent() {
    return {
      initEvent() {}
    };
  },
  createElement() {
    return {
      children: [],
      childNodes: [],
      style: {},
      setAttribute() {},
      getElementsByTagName() {
        return [];
      }
    };
  },
  createElementNS() {
    return {};
  },
  importNode() {
    return null;
  },
  location: {
    hash: '',
    host: '',
    hostname: '',
    href: '',
    origin: '',
    pathname: '',
    protocol: '',
    search: ''
  }
};
function getDocument() {
  const doc = typeof document !== 'undefined' ? document : {};
  extend$1(doc, ssrDocument);
  return doc;
}
const ssrWindow = {
  document: ssrDocument,
  navigator: {
    userAgent: ''
  },
  location: {
    hash: '',
    host: '',
    hostname: '',
    href: '',
    origin: '',
    pathname: '',
    protocol: '',
    search: ''
  },
  history: {
    replaceState() {},
    pushState() {},
    go() {},
    back() {}
  },
  CustomEvent: function CustomEvent() {
    return this;
  },
  addEventListener() {},
  removeEventListener() {},
  getComputedStyle() {
    return {
      getPropertyValue() {
        return '';
      }
    };
  },
  Image() {},
  Date() {},
  screen: {},
  setTimeout() {},
  clearTimeout() {},
  matchMedia() {
    return {};
  },
  requestAnimationFrame(callback) {
    if (typeof setTimeout === 'undefined') {
      callback();
      return null;
    }
    return setTimeout(callback, 0);
  },
  cancelAnimationFrame(id) {
    if (typeof setTimeout === 'undefined') {
      return;
    }
    clearTimeout(id);
  }
};
function getWindow() {
  const win = typeof window !== 'undefined' ? window : {};
  extend$1(win, ssrWindow);
  return win;
}

function classesToTokens(classes = '') {
  return classes.trim().split(' ').filter(c => !!c.trim());
}

function deleteProps(obj) {
  const object = obj;
  Object.keys(object).forEach(key => {
    try {
      object[key] = null;
    } catch (e) {
      // no getter for object
    }
    try {
      delete object[key];
    } catch (e) {
      // something got wrong
    }
  });
}
function nextTick(callback, delay = 0) {
  return setTimeout(callback, delay);
}
function now() {
  return Date.now();
}
function getComputedStyle$1(el) {
  const window = getWindow();
  let style;
  if (window.getComputedStyle) {
    style = window.getComputedStyle(el, null);
  }
  if (!style && el.currentStyle) {
    style = el.currentStyle;
  }
  if (!style) {
    style = el.style;
  }
  return style;
}
function getTranslate(el, axis = 'x') {
  const window = getWindow();
  let matrix;
  let curTransform;
  let transformMatrix;
  const curStyle = getComputedStyle$1(el);
  if (window.WebKitCSSMatrix) {
    curTransform = curStyle.transform || curStyle.webkitTransform;
    if (curTransform.split(',').length > 6) {
      curTransform = curTransform.split(', ').map(a => a.replace(',', '.')).join(', ');
    }
    // Some old versions of Webkit choke when 'none' is passed; pass
    // empty string instead in this case
    transformMatrix = new window.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
  } else {
    transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
    matrix = transformMatrix.toString().split(',');
  }
  if (axis === 'x') {
    // Latest Chrome and webkits Fix
    if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41;
    // Crazy IE10 Matrix
    else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
    // Normal Browsers
    else curTransform = parseFloat(matrix[4]);
  }
  if (axis === 'y') {
    // Latest Chrome and webkits Fix
    if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42;
    // Crazy IE10 Matrix
    else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
    // Normal Browsers
    else curTransform = parseFloat(matrix[5]);
  }
  return curTransform || 0;
}
function isObject(o) {
  return typeof o === 'object' && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === 'Object';
}
function isNode(node) {
  // eslint-disable-next-line
  if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
    return node instanceof HTMLElement;
  }
  return node && (node.nodeType === 1 || node.nodeType === 11);
}
function extend(...args) {
  const to = Object(args[0]);
  for (let i = 1; i < args.length; i += 1) {
    const nextSource = args[i];
    if (nextSource !== undefined && nextSource !== null && !isNode(nextSource)) {
      const keysArray = Object.keys(Object(nextSource)).filter(key => key !== '__proto__' && key !== 'constructor' && key !== 'prototype');
      for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
        const nextKey = keysArray[nextIndex];
        const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
        if (desc !== undefined && desc.enumerable) {
          if (isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
            if (nextSource[nextKey].__swiper__) {
              to[nextKey] = nextSource[nextKey];
            } else {
              extend(to[nextKey], nextSource[nextKey]);
            }
          } else if (!isObject(to[nextKey]) && isObject(nextSource[nextKey])) {
            to[nextKey] = {};
            if (nextSource[nextKey].__swiper__) {
              to[nextKey] = nextSource[nextKey];
            } else {
              extend(to[nextKey], nextSource[nextKey]);
            }
          } else {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
  }
  return to;
}
function setCSSProperty(el, varName, varValue) {
  el.style.setProperty(varName, varValue);
}
function animateCSSModeScroll({
  swiper,
  targetPosition,
  side
}) {
  const window = getWindow();
  const startPosition = -swiper.translate;
  let startTime = null;
  let time;
  const duration = swiper.params.speed;
  swiper.wrapperEl.style.scrollSnapType = 'none';
  window.cancelAnimationFrame(swiper.cssModeFrameID);
  const dir = targetPosition > startPosition ? 'next' : 'prev';
  const isOutOfBound = (current, target) => {
    return dir === 'next' && current >= target || dir === 'prev' && current <= target;
  };
  const animate = () => {
    time = new Date().getTime();
    if (startTime === null) {
      startTime = time;
    }
    const progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
    const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
    let currentPosition = startPosition + easeProgress * (targetPosition - startPosition);
    if (isOutOfBound(currentPosition, targetPosition)) {
      currentPosition = targetPosition;
    }
    swiper.wrapperEl.scrollTo({
      [side]: currentPosition
    });
    if (isOutOfBound(currentPosition, targetPosition)) {
      swiper.wrapperEl.style.overflow = 'hidden';
      swiper.wrapperEl.style.scrollSnapType = '';
      setTimeout(() => {
        swiper.wrapperEl.style.overflow = '';
        swiper.wrapperEl.scrollTo({
          [side]: currentPosition
        });
      });
      window.cancelAnimationFrame(swiper.cssModeFrameID);
      return;
    }
    swiper.cssModeFrameID = window.requestAnimationFrame(animate);
  };
  animate();
}
function getSlideTransformEl(slideEl) {
  return slideEl.querySelector('.swiper-slide-transform') || slideEl.shadowRoot && slideEl.shadowRoot.querySelector('.swiper-slide-transform') || slideEl;
}
function elementChildren(element, selector = '') {
  const window = getWindow();
  const children = [...element.children];
  if (window.HTMLSlotElement && element instanceof HTMLSlotElement) {
    children.push(...element.assignedElements());
  }
  if (!selector) {
    return children;
  }
  return children.filter(el => el.matches(selector));
}
function elementIsChildOfSlot(el, slot) {
  // Breadth-first search through all parent's children and assigned elements
  const elementsQueue = [slot];
  while (elementsQueue.length > 0) {
    const elementToCheck = elementsQueue.shift();
    if (el === elementToCheck) {
      return true;
    }
    elementsQueue.push(...elementToCheck.children, ...(elementToCheck.shadowRoot ? elementToCheck.shadowRoot.children : []), ...(elementToCheck.assignedElements ? elementToCheck.assignedElements() : []));
  }
}
function elementIsChildOf(el, parent) {
  const window = getWindow();
  let isChild = parent.contains(el);
  if (!isChild && window.HTMLSlotElement && parent instanceof HTMLSlotElement) {
    const children = [...parent.assignedElements()];
    isChild = children.includes(el);
    if (!isChild) {
      isChild = elementIsChildOfSlot(el, parent);
    }
  }
  return isChild;
}
function showWarning(text) {
  try {
    console.warn(text);
    return;
  } catch (err) {
    // err
  }
}
function createElement(tag, classes = []) {
  const el = document.createElement(tag);
  el.classList.add(...(Array.isArray(classes) ? classes : classesToTokens(classes)));
  return el;
}
function elementOffset(el) {
  const window = getWindow();
  const document = getDocument();
  const box = el.getBoundingClientRect();
  const body = document.body;
  const clientTop = el.clientTop || body.clientTop || 0;
  const clientLeft = el.clientLeft || body.clientLeft || 0;
  const scrollTop = el === window ? window.scrollY : el.scrollTop;
  const scrollLeft = el === window ? window.scrollX : el.scrollLeft;
  return {
    top: box.top + scrollTop - clientTop,
    left: box.left + scrollLeft - clientLeft
  };
}
function elementPrevAll(el, selector) {
  const prevEls = [];
  while (el.previousElementSibling) {
    const prev = el.previousElementSibling; // eslint-disable-line
    if (selector) {
      if (prev.matches(selector)) prevEls.push(prev);
    } else prevEls.push(prev);
    el = prev;
  }
  return prevEls;
}
function elementNextAll(el, selector) {
  const nextEls = [];
  while (el.nextElementSibling) {
    const next = el.nextElementSibling; // eslint-disable-line
    if (selector) {
      if (next.matches(selector)) nextEls.push(next);
    } else nextEls.push(next);
    el = next;
  }
  return nextEls;
}
function elementStyle(el, prop) {
  const window = getWindow();
  return window.getComputedStyle(el, null).getPropertyValue(prop);
}
function elementIndex(el) {
  let child = el;
  let i;
  if (child) {
    i = 0;
    // eslint-disable-next-line
    while ((child = child.previousSibling) !== null) {
      if (child.nodeType === 1) i += 1;
    }
    return i;
  }
  return undefined;
}
function elementParents(el, selector) {
  const parents = []; // eslint-disable-line
  let parent = el.parentElement; // eslint-disable-line
  while (parent) {
    if (selector) {
      if (parent.matches(selector)) parents.push(parent);
    } else {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }
  return parents;
}
function elementTransitionEnd(el, callback) {
  function fireCallBack(e) {
    if (e.target !== el) return;
    callback.call(el, e);
    el.removeEventListener('transitionend', fireCallBack);
  }
  if (callback) {
    el.addEventListener('transitionend', fireCallBack);
  }
}
function elementOuterSize(el, size, includeMargins) {
  const window = getWindow();
  {
    return el[size === 'width' ? 'offsetWidth' : 'offsetHeight'] + parseFloat(window.getComputedStyle(el, null).getPropertyValue(size === 'width' ? 'margin-right' : 'margin-top')) + parseFloat(window.getComputedStyle(el, null).getPropertyValue(size === 'width' ? 'margin-left' : 'margin-bottom'));
  }
}
function makeElementsArray(el) {
  return (Array.isArray(el) ? el : [el]).filter(e => !!e);
}
function setInnerHTML(el, html = '') {
  if (typeof trustedTypes !== 'undefined') {
    el.innerHTML = trustedTypes.createPolicy('html', {
      createHTML: s => s
    }).createHTML(html);
  } else {
    el.innerHTML = html;
  }
}

let support;
function calcSupport() {
  const window = getWindow();
  const document = getDocument();
  return {
    smoothScroll: document.documentElement && document.documentElement.style && 'scrollBehavior' in document.documentElement.style,
    touch: !!('ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch)
  };
}
function getSupport() {
  if (!support) {
    support = calcSupport();
  }
  return support;
}

let deviceCached;
function calcDevice({
  userAgent
} = {}) {
  const support = getSupport();
  const window = getWindow();
  const platform = window.navigator.platform;
  const ua = userAgent || window.navigator.userAgent;
  const device = {
    ios: false,
    android: false
  };
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
  let ipad = ua.match(/(iPad)(?!\1).*OS\s([\d_]+)/);
  const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
  const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
  const windows = platform === 'Win32';
  let macos = platform === 'MacIntel';

  // iPadOs 13 fix
  const iPadScreens = ['1024x1366', '1366x1024', '834x1194', '1194x834', '834x1112', '1112x834', '768x1024', '1024x768', '820x1180', '1180x820', '810x1080', '1080x810'];
  if (!ipad && macos && support.touch && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0) {
    ipad = ua.match(/(Version)\/([\d.]+)/);
    if (!ipad) ipad = [0, 1, '13_0_0'];
    macos = false;
  }

  // Android
  if (android && !windows) {
    device.os = 'android';
    device.android = true;
  }
  if (ipad || iphone || ipod) {
    device.os = 'ios';
    device.ios = true;
  }

  // Export object
  return device;
}
function getDevice(overrides = {}) {
  if (!deviceCached) {
    deviceCached = calcDevice(overrides);
  }
  return deviceCached;
}

let browser;
function calcBrowser() {
  const window = getWindow();
  const device = getDevice();
  let needPerspectiveFix = false;
  function isSafari() {
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0;
  }
  if (isSafari()) {
    const ua = String(window.navigator.userAgent);
    if (ua.includes('Version/')) {
      const [major, minor] = ua.split('Version/')[1].split(' ')[0].split('.').map(num => Number(num));
      needPerspectiveFix = major < 16 || major === 16 && minor < 2;
    }
  }
  const isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window.navigator.userAgent);
  const isSafariBrowser = isSafari();
  const need3dFix = isSafariBrowser || isWebView && device.ios;
  return {
    isSafari: needPerspectiveFix || isSafariBrowser,
    needPerspectiveFix,
    need3dFix,
    isWebView
  };
}
function getBrowser() {
  if (!browser) {
    browser = calcBrowser();
  }
  return browser;
}

function Resize({
  swiper,
  on,
  emit
}) {
  const window = getWindow();
  let observer = null;
  let animationFrame = null;
  const resizeHandler = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized) return;
    emit('beforeResize');
    emit('resize');
  };
  const createObserver = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized) return;
    observer = new ResizeObserver(entries => {
      animationFrame = window.requestAnimationFrame(() => {
        const {
          width,
          height
        } = swiper;
        let newWidth = width;
        let newHeight = height;
        entries.forEach(({
          contentBoxSize,
          contentRect,
          target
        }) => {
          if (target && target !== swiper.el) return;
          newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
          newHeight = contentRect ? contentRect.height : (contentBoxSize[0] || contentBoxSize).blockSize;
        });
        if (newWidth !== width || newHeight !== height) {
          resizeHandler();
        }
      });
    });
    observer.observe(swiper.el);
  };
  const removeObserver = () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }
    if (observer && observer.unobserve && swiper.el) {
      observer.unobserve(swiper.el);
      observer = null;
    }
  };
  const orientationChangeHandler = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized) return;
    emit('orientationchange');
  };
  on('init', () => {
    if (swiper.params.resizeObserver && typeof window.ResizeObserver !== 'undefined') {
      createObserver();
      return;
    }
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', orientationChangeHandler);
  });
  on('destroy', () => {
    removeObserver();
    window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('orientationchange', orientationChangeHandler);
  });
}

function Observer({
  swiper,
  extendParams,
  on,
  emit
}) {
  const observers = [];
  const window = getWindow();
  const attach = (target, options = {}) => {
    const ObserverFunc = window.MutationObserver || window.WebkitMutationObserver;
    const observer = new ObserverFunc(mutations => {
      // The observerUpdate event should only be triggered
      // once despite the number of mutations.  Additional
      // triggers are redundant and are very costly
      if (swiper.__preventObserver__) return;
      if (mutations.length === 1) {
        emit('observerUpdate', mutations[0]);
        return;
      }
      const observerUpdate = function observerUpdate() {
        emit('observerUpdate', mutations[0]);
      };
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(observerUpdate);
      } else {
        window.setTimeout(observerUpdate, 0);
      }
    });
    observer.observe(target, {
      attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
      childList: swiper.isElement || (typeof options.childList === 'undefined' ? true : options).childList,
      characterData: typeof options.characterData === 'undefined' ? true : options.characterData
    });
    observers.push(observer);
  };
  const init = () => {
    if (!swiper.params.observer) return;
    if (swiper.params.observeParents) {
      const containerParents = elementParents(swiper.hostEl);
      for (let i = 0; i < containerParents.length; i += 1) {
        attach(containerParents[i]);
      }
    }
    // Observe container
    attach(swiper.hostEl, {
      childList: swiper.params.observeSlideChildren
    });

    // Observe wrapper
    attach(swiper.wrapperEl, {
      attributes: false
    });
  };
  const destroy = () => {
    observers.forEach(observer => {
      observer.disconnect();
    });
    observers.splice(0, observers.length);
  };
  extendParams({
    observer: false,
    observeParents: false,
    observeSlideChildren: false
  });
  on('init', init);
  on('destroy', destroy);
}

/* eslint-disable no-underscore-dangle */

var eventsEmitter = {
  on(events, handler, priority) {
    const self = this;
    if (!self.eventsListeners || self.destroyed) return self;
    if (typeof handler !== 'function') return self;
    const method = priority ? 'unshift' : 'push';
    events.split(' ').forEach(event => {
      if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
      self.eventsListeners[event][method](handler);
    });
    return self;
  },
  once(events, handler, priority) {
    const self = this;
    if (!self.eventsListeners || self.destroyed) return self;
    if (typeof handler !== 'function') return self;
    function onceHandler(...args) {
      self.off(events, onceHandler);
      if (onceHandler.__emitterProxy) {
        delete onceHandler.__emitterProxy;
      }
      handler.apply(self, args);
    }
    onceHandler.__emitterProxy = handler;
    return self.on(events, onceHandler, priority);
  },
  onAny(handler, priority) {
    const self = this;
    if (!self.eventsListeners || self.destroyed) return self;
    if (typeof handler !== 'function') return self;
    const method = priority ? 'unshift' : 'push';
    if (self.eventsAnyListeners.indexOf(handler) < 0) {
      self.eventsAnyListeners[method](handler);
    }
    return self;
  },
  offAny(handler) {
    const self = this;
    if (!self.eventsListeners || self.destroyed) return self;
    if (!self.eventsAnyListeners) return self;
    const index = self.eventsAnyListeners.indexOf(handler);
    if (index >= 0) {
      self.eventsAnyListeners.splice(index, 1);
    }
    return self;
  },
  off(events, handler) {
    const self = this;
    if (!self.eventsListeners || self.destroyed) return self;
    if (!self.eventsListeners) return self;
    events.split(' ').forEach(event => {
      if (typeof handler === 'undefined') {
        self.eventsListeners[event] = [];
      } else if (self.eventsListeners[event]) {
        self.eventsListeners[event].forEach((eventHandler, index) => {
          if (eventHandler === handler || eventHandler.__emitterProxy && eventHandler.__emitterProxy === handler) {
            self.eventsListeners[event].splice(index, 1);
          }
        });
      }
    });
    return self;
  },
  emit(...args) {
    const self = this;
    if (!self.eventsListeners || self.destroyed) return self;
    if (!self.eventsListeners) return self;
    let events;
    let data;
    let context;
    if (typeof args[0] === 'string' || Array.isArray(args[0])) {
      events = args[0];
      data = args.slice(1, args.length);
      context = self;
    } else {
      events = args[0].events;
      data = args[0].data;
      context = args[0].context || self;
    }
    data.unshift(context);
    const eventsArray = Array.isArray(events) ? events : events.split(' ');
    eventsArray.forEach(event => {
      if (self.eventsAnyListeners && self.eventsAnyListeners.length) {
        self.eventsAnyListeners.forEach(eventHandler => {
          eventHandler.apply(context, [event, ...data]);
        });
      }
      if (self.eventsListeners && self.eventsListeners[event]) {
        self.eventsListeners[event].forEach(eventHandler => {
          eventHandler.apply(context, data);
        });
      }
    });
    return self;
  }
};

function updateSize() {
  const swiper = this;
  let width;
  let height;
  const el = swiper.el;
  if (typeof swiper.params.width !== 'undefined' && swiper.params.width !== null) {
    width = swiper.params.width;
  } else {
    width = el.clientWidth;
  }
  if (typeof swiper.params.height !== 'undefined' && swiper.params.height !== null) {
    height = swiper.params.height;
  } else {
    height = el.clientHeight;
  }
  if (width === 0 && swiper.isHorizontal() || height === 0 && swiper.isVertical()) {
    return;
  }

  // Subtract paddings
  width = width - parseInt(elementStyle(el, 'padding-left') || 0, 10) - parseInt(elementStyle(el, 'padding-right') || 0, 10);
  height = height - parseInt(elementStyle(el, 'padding-top') || 0, 10) - parseInt(elementStyle(el, 'padding-bottom') || 0, 10);
  if (Number.isNaN(width)) width = 0;
  if (Number.isNaN(height)) height = 0;
  Object.assign(swiper, {
    width,
    height,
    size: swiper.isHorizontal() ? width : height
  });
}

function updateSlides() {
  const swiper = this;
  function getDirectionPropertyValue(node, label) {
    return parseFloat(node.getPropertyValue(swiper.getDirectionLabel(label)) || 0);
  }
  const params = swiper.params;
  const {
    wrapperEl,
    slidesEl,
    rtlTranslate: rtl,
    wrongRTL
  } = swiper;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  const previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
  const slides = elementChildren(slidesEl, `.${swiper.params.slideClass}, swiper-slide`);
  const slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
  let snapGrid = [];
  const slidesGrid = [];
  const slidesSizesGrid = [];
  let offsetBefore = params.slidesOffsetBefore;
  if (typeof offsetBefore === 'function') {
    offsetBefore = params.slidesOffsetBefore.call(swiper);
  }
  let offsetAfter = params.slidesOffsetAfter;
  if (typeof offsetAfter === 'function') {
    offsetAfter = params.slidesOffsetAfter.call(swiper);
  }
  const previousSnapGridLength = swiper.snapGrid.length;
  const previousSlidesGridLength = swiper.slidesGrid.length;
  const swiperSize = swiper.size - offsetBefore - offsetAfter;
  let spaceBetween = params.spaceBetween;
  let slidePosition = -offsetBefore;
  let prevSlideSize = 0;
  let index = 0;
  if (typeof swiperSize === 'undefined') {
    return;
  }
  if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
    spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * swiperSize;
  } else if (typeof spaceBetween === 'string') {
    spaceBetween = parseFloat(spaceBetween);
  }
  swiper.virtualSize = -spaceBetween - offsetBefore - offsetAfter;

  // reset margins
  slides.forEach(slideEl => {
    if (rtl) {
      slideEl.style.marginLeft = '';
    } else {
      slideEl.style.marginRight = '';
    }
    slideEl.style.marginBottom = '';
    slideEl.style.marginTop = '';
  });

  // reset cssMode offsets
  if (params.centeredSlides && params.cssMode) {
    setCSSProperty(wrapperEl, '--swiper-centered-offset-before', '');
    setCSSProperty(wrapperEl, '--swiper-centered-offset-after', '');
  }

  // set cssMode offsets
  if (params.cssMode) {
    setCSSProperty(wrapperEl, '--swiper-slides-offset-before', `${offsetBefore}px`);
    setCSSProperty(wrapperEl, '--swiper-slides-offset-after', `${offsetAfter}px`);
  }
  const gridEnabled = params.grid && params.grid.rows > 1 && swiper.grid;
  if (gridEnabled) {
    swiper.grid.initSlides(slides);
  } else if (swiper.grid) {
    swiper.grid.unsetSlides();
  }

  // Calc slides
  let slideSize;
  const shouldResetSlideSize = params.slidesPerView === 'auto' && params.breakpoints && Object.keys(params.breakpoints).filter(key => {
    return typeof params.breakpoints[key].slidesPerView !== 'undefined';
  }).length > 0;
  for (let i = 0; i < slidesLength; i += 1) {
    slideSize = 0;
    const slide = slides[i];
    if (slide) {
      if (gridEnabled) {
        swiper.grid.updateSlide(i, slide, slides);
      }
      if (elementStyle(slide, 'display') === 'none') continue; // eslint-disable-line
    }

    if (isVirtual && params.slidesPerView === 'auto') {
      if (params.virtual.slidesPerViewAutoSlideSize) {
        slideSize = params.virtual.slidesPerViewAutoSlideSize;
      }
      if (slideSize && slide) {
        if (params.roundLengths) slideSize = Math.floor(slideSize);
        slide.style[swiper.getDirectionLabel('width')] = `${slideSize}px`;
      }
    } else if (params.slidesPerView === 'auto') {
      if (shouldResetSlideSize) {
        slide.style[swiper.getDirectionLabel('width')] = ``;
      }
      const slideStyles = getComputedStyle(slide);
      const currentTransform = slide.style.transform;
      const currentWebKitTransform = slide.style.webkitTransform;
      if (currentTransform) {
        slide.style.transform = 'none';
      }
      if (currentWebKitTransform) {
        slide.style.webkitTransform = 'none';
      }
      if (params.roundLengths) {
        slideSize = swiper.isHorizontal() ? elementOuterSize(slide, 'width') : elementOuterSize(slide, 'height');
      } else {
        // eslint-disable-next-line
        const width = getDirectionPropertyValue(slideStyles, 'width');
        const paddingLeft = getDirectionPropertyValue(slideStyles, 'padding-left');
        const paddingRight = getDirectionPropertyValue(slideStyles, 'padding-right');
        const marginLeft = getDirectionPropertyValue(slideStyles, 'margin-left');
        const marginRight = getDirectionPropertyValue(slideStyles, 'margin-right');
        const boxSizing = slideStyles.getPropertyValue('box-sizing');
        if (boxSizing && boxSizing === 'border-box') {
          slideSize = width + marginLeft + marginRight;
        } else {
          const {
            clientWidth,
            offsetWidth
          } = slide;
          slideSize = width + paddingLeft + paddingRight + marginLeft + marginRight + (offsetWidth - clientWidth);
        }
      }
      if (currentTransform) {
        slide.style.transform = currentTransform;
      }
      if (currentWebKitTransform) {
        slide.style.webkitTransform = currentWebKitTransform;
      }
      if (params.roundLengths) slideSize = Math.floor(slideSize);
    } else {
      slideSize = (swiperSize - (params.slidesPerView - 1) * spaceBetween) / params.slidesPerView;
      if (params.roundLengths) slideSize = Math.floor(slideSize);
      if (slide) {
        slide.style[swiper.getDirectionLabel('width')] = `${slideSize}px`;
      }
    }
    if (slide) {
      slide.swiperSlideSize = slideSize;
    }
    slidesSizesGrid.push(slideSize);
    if (params.centeredSlides) {
      slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
      if (prevSlideSize === 0 && i !== 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
      if (i === 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
      if (Math.abs(slidePosition) < 1 / 1000) slidePosition = 0;
      if (params.roundLengths) slidePosition = Math.floor(slidePosition);
      if (index % params.slidesPerGroup === 0) snapGrid.push(slidePosition);
      slidesGrid.push(slidePosition);
    } else {
      if (params.roundLengths) slidePosition = Math.floor(slidePosition);
      if ((index - Math.min(swiper.params.slidesPerGroupSkip, index)) % swiper.params.slidesPerGroup === 0) snapGrid.push(slidePosition);
      slidesGrid.push(slidePosition);
      slidePosition = slidePosition + slideSize + spaceBetween;
    }
    swiper.virtualSize += slideSize + spaceBetween;
    prevSlideSize = slideSize;
    index += 1;
  }
  swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
  if (rtl && wrongRTL && (params.effect === 'slide' || params.effect === 'coverflow')) {
    wrapperEl.style.width = `${swiper.virtualSize + spaceBetween}px`;
  }
  if (params.setWrapperSize) {
    wrapperEl.style[swiper.getDirectionLabel('width')] = `${swiper.virtualSize + spaceBetween}px`;
  }
  if (gridEnabled) {
    swiper.grid.updateWrapperSize(slideSize, snapGrid);
  }

  // Remove last grid elements depending on width
  if (!params.centeredSlides) {
    // Check if snapToSlideEdge should be applied
    const isFractionalSlidesPerView = params.slidesPerView !== 'auto' && params.slidesPerView % 1 !== 0;
    const shouldSnapToSlideEdge = params.snapToSlideEdge && !params.loop && (params.slidesPerView === 'auto' || isFractionalSlidesPerView);

    // Calculate the last allowed snap index when snapToSlideEdge is enabled
    // This ensures minimum slides are visible at the end
    let lastAllowedSnapIndex = snapGrid.length;
    if (shouldSnapToSlideEdge) {
      let minVisibleSlides;
      if (params.slidesPerView === 'auto') {
        // For 'auto' mode, calculate how many slides fit based on actual sizes
        minVisibleSlides = 1;
        let accumulatedSize = 0;
        for (let i = slidesSizesGrid.length - 1; i >= 0; i -= 1) {
          accumulatedSize += slidesSizesGrid[i] + (i < slidesSizesGrid.length - 1 ? spaceBetween : 0);
          if (accumulatedSize <= swiperSize) {
            minVisibleSlides = slidesSizesGrid.length - i;
          } else {
            break;
          }
        }
      } else {
        minVisibleSlides = Math.floor(params.slidesPerView);
      }
      lastAllowedSnapIndex = Math.max(slidesLength - minVisibleSlides, 0);
    }
    const newSlidesGrid = [];
    for (let i = 0; i < snapGrid.length; i += 1) {
      let slidesGridItem = snapGrid[i];
      if (params.roundLengths) slidesGridItem = Math.floor(slidesGridItem);
      if (shouldSnapToSlideEdge) {
        // When snapToSlideEdge is enabled, only keep snaps up to lastAllowedSnapIndex
        if (i <= lastAllowedSnapIndex) {
          newSlidesGrid.push(slidesGridItem);
        }
      } else if (snapGrid[i] <= swiper.virtualSize - swiperSize) {
        // When snapToSlideEdge is disabled, keep snaps that fit within scrollable area
        newSlidesGrid.push(slidesGridItem);
      }
    }
    snapGrid = newSlidesGrid;
    if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
      // Only add edge-aligned snap if snapToSlideEdge is not enabled
      if (!shouldSnapToSlideEdge) {
        snapGrid.push(swiper.virtualSize - swiperSize);
      }
    }
  }
  if (isVirtual && params.loop) {
    const size = slidesSizesGrid[0] + spaceBetween;
    if (params.slidesPerGroup > 1) {
      const groups = Math.ceil((swiper.virtual.slidesBefore + swiper.virtual.slidesAfter) / params.slidesPerGroup);
      const groupSize = size * params.slidesPerGroup;
      for (let i = 0; i < groups; i += 1) {
        snapGrid.push(snapGrid[snapGrid.length - 1] + groupSize);
      }
    }
    for (let i = 0; i < swiper.virtual.slidesBefore + swiper.virtual.slidesAfter; i += 1) {
      if (params.slidesPerGroup === 1) {
        snapGrid.push(snapGrid[snapGrid.length - 1] + size);
      }
      slidesGrid.push(slidesGrid[slidesGrid.length - 1] + size);
      swiper.virtualSize += size;
    }
  }
  if (snapGrid.length === 0) snapGrid = [0];
  if (spaceBetween !== 0) {
    const key = swiper.isHorizontal() && rtl ? 'marginLeft' : swiper.getDirectionLabel('marginRight');
    slides.filter((_, slideIndex) => {
      if (!params.cssMode || params.loop) return true;
      if (slideIndex === slides.length - 1) {
        return false;
      }
      return true;
    }).forEach(slideEl => {
      slideEl.style[key] = `${spaceBetween}px`;
    });
  }
  if (params.centeredSlides && params.centeredSlidesBounds) {
    let allSlidesSize = 0;
    slidesSizesGrid.forEach(slideSizeValue => {
      allSlidesSize += slideSizeValue + (spaceBetween || 0);
    });
    allSlidesSize -= spaceBetween;
    const maxSnap = allSlidesSize > swiperSize ? allSlidesSize - swiperSize : 0;
    snapGrid = snapGrid.map(snap => {
      if (snap <= 0) return -offsetBefore;
      if (snap > maxSnap) return maxSnap + offsetAfter;
      return snap;
    });
  }
  if (params.centerInsufficientSlides) {
    let allSlidesSize = 0;
    slidesSizesGrid.forEach(slideSizeValue => {
      allSlidesSize += slideSizeValue + (spaceBetween || 0);
    });
    allSlidesSize -= spaceBetween;
    if (allSlidesSize < swiperSize) {
      const allSlidesOffset = (swiperSize - allSlidesSize) / 2;
      snapGrid.forEach((snap, snapIndex) => {
        snapGrid[snapIndex] = snap - allSlidesOffset;
      });
      slidesGrid.forEach((snap, snapIndex) => {
        slidesGrid[snapIndex] = snap + allSlidesOffset;
      });
    }
  }
  Object.assign(swiper, {
    slides,
    snapGrid,
    slidesGrid,
    slidesSizesGrid
  });
  if (params.centeredSlides && params.cssMode && !params.centeredSlidesBounds) {
    setCSSProperty(wrapperEl, '--swiper-centered-offset-before', `${-snapGrid[0]}px`);
    setCSSProperty(wrapperEl, '--swiper-centered-offset-after', `${swiper.size / 2 - slidesSizesGrid[slidesSizesGrid.length - 1] / 2}px`);
    const addToSnapGrid = -swiper.snapGrid[0];
    const addToSlidesGrid = -swiper.slidesGrid[0];
    swiper.snapGrid = swiper.snapGrid.map(v => v + addToSnapGrid);
    swiper.slidesGrid = swiper.slidesGrid.map(v => v + addToSlidesGrid);
  }
  if (slidesLength !== previousSlidesLength) {
    swiper.emit('slidesLengthChange');
  }
  if (snapGrid.length !== previousSnapGridLength) {
    if (swiper.params.watchOverflow) swiper.checkOverflow();
    swiper.emit('snapGridLengthChange');
  }
  if (slidesGrid.length !== previousSlidesGridLength) {
    swiper.emit('slidesGridLengthChange');
  }
  if (params.watchSlidesProgress) {
    swiper.updateSlidesOffset();
  }
  swiper.emit('slidesUpdated');
  if (!isVirtual && !params.cssMode && (params.effect === 'slide' || params.effect === 'fade')) {
    const backFaceHiddenClass = `${params.containerModifierClass}backface-hidden`;
    const hasClassBackfaceClassAdded = swiper.el.classList.contains(backFaceHiddenClass);
    if (slidesLength <= params.maxBackfaceHiddenSlides) {
      if (!hasClassBackfaceClassAdded) swiper.el.classList.add(backFaceHiddenClass);
    } else if (hasClassBackfaceClassAdded) {
      swiper.el.classList.remove(backFaceHiddenClass);
    }
  }
}

function updateAutoHeight(speed) {
  const swiper = this;
  const activeSlides = [];
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
  let newHeight = 0;
  let i;
  if (typeof speed === 'number') {
    swiper.setTransition(speed);
  } else if (speed === true) {
    swiper.setTransition(swiper.params.speed);
  }
  const getSlideByIndex = index => {
    if (isVirtual) {
      return swiper.slides[swiper.getSlideIndexByData(index)];
    }
    return swiper.slides[index];
  };
  // Find slides currently in view
  if (swiper.params.slidesPerView !== 'auto' && swiper.params.slidesPerView > 1) {
    if (swiper.params.centeredSlides) {
      (swiper.visibleSlides || []).forEach(slide => {
        activeSlides.push(slide);
      });
    } else {
      for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
        const index = swiper.activeIndex + i;
        if (index > swiper.slides.length && !isVirtual) break;
        activeSlides.push(getSlideByIndex(index));
      }
    }
  } else {
    activeSlides.push(getSlideByIndex(swiper.activeIndex));
  }

  // Find new height from highest slide in view
  for (i = 0; i < activeSlides.length; i += 1) {
    if (typeof activeSlides[i] !== 'undefined') {
      const height = activeSlides[i].offsetHeight;
      newHeight = height > newHeight ? height : newHeight;
    }
  }

  // Update Height
  if (newHeight || newHeight === 0) swiper.wrapperEl.style.height = `${newHeight}px`;
}

function updateSlidesOffset() {
  const swiper = this;
  const slides = swiper.slides;
  // eslint-disable-next-line
  const minusOffset = swiper.isElement ? swiper.isHorizontal() ? swiper.wrapperEl.offsetLeft : swiper.wrapperEl.offsetTop : 0;
  for (let i = 0; i < slides.length; i += 1) {
    slides[i].swiperSlideOffset = (swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop) - minusOffset - swiper.cssOverflowAdjustment();
  }
}

const toggleSlideClasses$1 = (slideEl, condition, className) => {
  if (condition && !slideEl.classList.contains(className)) {
    slideEl.classList.add(className);
  } else if (!condition && slideEl.classList.contains(className)) {
    slideEl.classList.remove(className);
  }
};
function updateSlidesProgress(translate = this && this.translate || 0) {
  const swiper = this;
  const params = swiper.params;
  const {
    slides,
    rtlTranslate: rtl,
    snapGrid
  } = swiper;
  if (slides.length === 0) return;
  if (typeof slides[0].swiperSlideOffset === 'undefined') swiper.updateSlidesOffset();
  let offsetCenter = -translate;
  if (rtl) offsetCenter = translate;
  swiper.visibleSlidesIndexes = [];
  swiper.visibleSlides = [];
  let spaceBetween = params.spaceBetween;
  if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
    spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * swiper.size;
  } else if (typeof spaceBetween === 'string') {
    spaceBetween = parseFloat(spaceBetween);
  }
  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    let slideOffset = slide.swiperSlideOffset;
    if (params.cssMode && params.centeredSlides) {
      slideOffset -= slides[0].swiperSlideOffset;
    }
    const slideProgress = (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide.swiperSlideSize + spaceBetween);
    const originalSlideProgress = (offsetCenter - snapGrid[0] + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide.swiperSlideSize + spaceBetween);
    const slideBefore = -(offsetCenter - slideOffset);
    const slideAfter = slideBefore + swiper.slidesSizesGrid[i];
    const isFullyVisible = slideBefore >= 0 && slideBefore <= swiper.size - swiper.slidesSizesGrid[i];
    const isVisible = slideBefore >= 0 && slideBefore < swiper.size - 1 || slideAfter > 1 && slideAfter <= swiper.size || slideBefore <= 0 && slideAfter >= swiper.size;
    if (isVisible) {
      swiper.visibleSlides.push(slide);
      swiper.visibleSlidesIndexes.push(i);
    }
    toggleSlideClasses$1(slide, isVisible, params.slideVisibleClass);
    toggleSlideClasses$1(slide, isFullyVisible, params.slideFullyVisibleClass);
    slide.progress = rtl ? -slideProgress : slideProgress;
    slide.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
  }
}

function updateProgress(translate) {
  const swiper = this;
  if (typeof translate === 'undefined') {
    const multiplier = swiper.rtlTranslate ? -1 : 1;
    // eslint-disable-next-line
    translate = swiper && swiper.translate && swiper.translate * multiplier || 0;
  }
  const params = swiper.params;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  let {
    progress,
    isBeginning,
    isEnd,
    progressLoop
  } = swiper;
  const wasBeginning = isBeginning;
  const wasEnd = isEnd;
  if (translatesDiff === 0) {
    progress = 0;
    isBeginning = true;
    isEnd = true;
  } else {
    progress = (translate - swiper.minTranslate()) / translatesDiff;
    const isBeginningRounded = Math.abs(translate - swiper.minTranslate()) < 1;
    const isEndRounded = Math.abs(translate - swiper.maxTranslate()) < 1;
    isBeginning = isBeginningRounded || progress <= 0;
    isEnd = isEndRounded || progress >= 1;
    if (isBeginningRounded) progress = 0;
    if (isEndRounded) progress = 1;
  }
  if (params.loop) {
    const firstSlideIndex = swiper.getSlideIndexByData(0);
    const lastSlideIndex = swiper.getSlideIndexByData(swiper.slides.length - 1);
    const firstSlideTranslate = swiper.slidesGrid[firstSlideIndex];
    const lastSlideTranslate = swiper.slidesGrid[lastSlideIndex];
    const translateMax = swiper.slidesGrid[swiper.slidesGrid.length - 1];
    const translateAbs = Math.abs(translate);
    if (translateAbs >= firstSlideTranslate) {
      progressLoop = (translateAbs - firstSlideTranslate) / translateMax;
    } else {
      progressLoop = (translateAbs + translateMax - lastSlideTranslate) / translateMax;
    }
    if (progressLoop > 1) progressLoop -= 1;
  }
  Object.assign(swiper, {
    progress,
    progressLoop,
    isBeginning,
    isEnd
  });
  if (params.watchSlidesProgress || params.centeredSlides && params.autoHeight) swiper.updateSlidesProgress(translate);
  if (isBeginning && !wasBeginning) {
    swiper.emit('reachBeginning toEdge');
  }
  if (isEnd && !wasEnd) {
    swiper.emit('reachEnd toEdge');
  }
  if (wasBeginning && !isBeginning || wasEnd && !isEnd) {
    swiper.emit('fromEdge');
  }
  swiper.emit('progress', progress);
}

const toggleSlideClasses = (slideEl, condition, className) => {
  if (condition && !slideEl.classList.contains(className)) {
    slideEl.classList.add(className);
  } else if (!condition && slideEl.classList.contains(className)) {
    slideEl.classList.remove(className);
  }
};
function updateSlidesClasses() {
  const swiper = this;
  const {
    slides,
    params,
    slidesEl,
    activeIndex
  } = swiper;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  const getFilteredSlide = selector => {
    return elementChildren(slidesEl, `.${params.slideClass}${selector}, swiper-slide${selector}`)[0];
  };
  let activeSlide;
  let prevSlide;
  let nextSlide;
  if (isVirtual) {
    if (params.loop) {
      let slideIndex = activeIndex - swiper.virtual.slidesBefore;
      if (slideIndex < 0) slideIndex = swiper.virtual.slides.length + slideIndex;
      if (slideIndex >= swiper.virtual.slides.length) slideIndex -= swiper.virtual.slides.length;
      activeSlide = getFilteredSlide(`[data-swiper-slide-index="${slideIndex}"]`);
    } else {
      activeSlide = getFilteredSlide(`[data-swiper-slide-index="${activeIndex}"]`);
    }
  } else {
    if (gridEnabled) {
      activeSlide = slides.find(slideEl => slideEl.column === activeIndex);
      nextSlide = slides.find(slideEl => slideEl.column === activeIndex + 1);
      prevSlide = slides.find(slideEl => slideEl.column === activeIndex - 1);
    } else {
      activeSlide = slides[activeIndex];
    }
  }
  if (activeSlide) {
    if (!gridEnabled) {
      // Next Slide
      nextSlide = elementNextAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
      if (params.loop && !nextSlide) {
        nextSlide = slides[0];
      }

      // Prev Slide
      prevSlide = elementPrevAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
      if (params.loop && !prevSlide === 0) {
        prevSlide = slides[slides.length - 1];
      }
    }
  }
  slides.forEach(slideEl => {
    toggleSlideClasses(slideEl, slideEl === activeSlide, params.slideActiveClass);
    toggleSlideClasses(slideEl, slideEl === nextSlide, params.slideNextClass);
    toggleSlideClasses(slideEl, slideEl === prevSlide, params.slidePrevClass);
  });
  swiper.emitSlidesClasses();
}

const processLazyPreloader = (swiper, imageEl) => {
  if (!swiper || swiper.destroyed || !swiper.params) return;
  const slideSelector = () => swiper.isElement ? `swiper-slide` : `.${swiper.params.slideClass}`;
  const slideEl = imageEl.closest(slideSelector());
  if (slideEl) {
    let lazyEl = slideEl.querySelector(`.${swiper.params.lazyPreloaderClass}`);
    if (!lazyEl && swiper.isElement) {
      if (slideEl.shadowRoot) {
        lazyEl = slideEl.shadowRoot.querySelector(`.${swiper.params.lazyPreloaderClass}`);
      } else {
        // init later
        requestAnimationFrame(() => {
          if (slideEl.shadowRoot) {
            lazyEl = slideEl.shadowRoot.querySelector(`.${swiper.params.lazyPreloaderClass}`);
            if (lazyEl && !lazyEl.lazyPreloaderManaged) lazyEl.remove();
          }
        });
      }
    }
    // Skip removal if managed by React/Vue component
    if (lazyEl && !lazyEl.lazyPreloaderManaged) lazyEl.remove();
  }
};
const unlazy = (swiper, index) => {
  if (!swiper.slides[index]) return;
  const imageEl = swiper.slides[index].querySelector('[loading="lazy"]');
  if (imageEl) imageEl.removeAttribute('loading');
};
const preload = swiper => {
  if (!swiper || swiper.destroyed || !swiper.params) return;
  let amount = swiper.params.lazyPreloadPrevNext;
  const len = swiper.slides.length;
  if (!len || !amount || amount < 0) return;
  amount = Math.min(amount, len);
  const slidesPerView = swiper.params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : Math.ceil(swiper.params.slidesPerView);
  const activeIndex = swiper.activeIndex;
  if (swiper.params.grid && swiper.params.grid.rows > 1) {
    const activeColumn = activeIndex;
    const preloadColumns = [activeColumn - amount];
    preloadColumns.push(...Array.from({
      length: amount
    }).map((_, i) => {
      return activeColumn + slidesPerView + i;
    }));
    swiper.slides.forEach((slideEl, i) => {
      if (preloadColumns.includes(slideEl.column)) unlazy(swiper, i);
    });
    return;
  }
  const slideIndexLastInView = activeIndex + slidesPerView - 1;
  if (swiper.params.rewind || swiper.params.loop) {
    for (let i = activeIndex - amount; i <= slideIndexLastInView + amount; i += 1) {
      const realIndex = (i % len + len) % len;
      if (realIndex < activeIndex || realIndex > slideIndexLastInView) unlazy(swiper, realIndex);
    }
  } else {
    for (let i = Math.max(activeIndex - amount, 0); i <= Math.min(slideIndexLastInView + amount, len - 1); i += 1) {
      if (i !== activeIndex && (i > slideIndexLastInView || i < activeIndex)) {
        unlazy(swiper, i);
      }
    }
  }
};

function getActiveIndexByTranslate(swiper) {
  const {
    slidesGrid,
    params
  } = swiper;
  const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  let activeIndex;
  for (let i = 0; i < slidesGrid.length; i += 1) {
    if (typeof slidesGrid[i + 1] !== 'undefined') {
      if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1] - (slidesGrid[i + 1] - slidesGrid[i]) / 2) {
        activeIndex = i;
      } else if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1]) {
        activeIndex = i + 1;
      }
    } else if (translate >= slidesGrid[i]) {
      activeIndex = i;
    }
  }
  // Normalize slideIndex
  if (params.normalizeSlideIndex) {
    if (activeIndex < 0 || typeof activeIndex === 'undefined') activeIndex = 0;
  }
  return activeIndex;
}
function updateActiveIndex(newActiveIndex) {
  const swiper = this;
  const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  const {
    snapGrid,
    params,
    activeIndex: previousIndex,
    realIndex: previousRealIndex,
    snapIndex: previousSnapIndex
  } = swiper;
  let activeIndex = newActiveIndex;
  let snapIndex;
  const getVirtualRealIndex = aIndex => {
    let realIndex = aIndex - swiper.virtual.slidesBefore;
    if (realIndex < 0) {
      realIndex = swiper.virtual.slides.length + realIndex;
    }
    if (realIndex >= swiper.virtual.slides.length) {
      realIndex -= swiper.virtual.slides.length;
    }
    return realIndex;
  };
  if (typeof activeIndex === 'undefined') {
    activeIndex = getActiveIndexByTranslate(swiper);
  }
  if (snapGrid.indexOf(translate) >= 0) {
    snapIndex = snapGrid.indexOf(translate);
  } else {
    const skip = Math.min(params.slidesPerGroupSkip, activeIndex);
    snapIndex = skip + Math.floor((activeIndex - skip) / params.slidesPerGroup);
  }
  if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
  if (activeIndex === previousIndex && !swiper.params.loop) {
    if (snapIndex !== previousSnapIndex) {
      swiper.snapIndex = snapIndex;
      swiper.emit('snapIndexChange');
    }
    return;
  }
  if (activeIndex === previousIndex && swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
    swiper.realIndex = getVirtualRealIndex(activeIndex);
    return;
  }
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;

  // Get real index
  let realIndex;
  if (swiper.virtual && params.virtual.enabled) {
    if (params.loop) {
      realIndex = getVirtualRealIndex(activeIndex);
    } else {
      realIndex = activeIndex;
    }
  } else if (gridEnabled) {
    const firstSlideInColumn = swiper.slides.find(slideEl => slideEl.column === activeIndex);
    let activeSlideIndex = parseInt(firstSlideInColumn.getAttribute('data-swiper-slide-index'), 10);
    if (Number.isNaN(activeSlideIndex)) {
      activeSlideIndex = Math.max(swiper.slides.indexOf(firstSlideInColumn), 0);
    }
    realIndex = Math.floor(activeSlideIndex / params.grid.rows);
  } else if (swiper.slides[activeIndex]) {
    const slideIndex = swiper.slides[activeIndex].getAttribute('data-swiper-slide-index');
    if (slideIndex) {
      realIndex = parseInt(slideIndex, 10);
    } else {
      realIndex = activeIndex;
    }
  } else {
    realIndex = activeIndex;
  }
  Object.assign(swiper, {
    previousSnapIndex,
    snapIndex,
    previousRealIndex,
    realIndex,
    previousIndex,
    activeIndex
  });
  if (swiper.initialized) {
    preload(swiper);
  }
  swiper.emit('activeIndexChange');
  swiper.emit('snapIndexChange');
  if (swiper.initialized || swiper.params.runCallbacksOnInit) {
    if (previousRealIndex !== realIndex) {
      swiper.emit('realIndexChange');
    }
    swiper.emit('slideChange');
  }
}

function updateClickedSlide(el, path) {
  const swiper = this;
  const params = swiper.params;
  let slide = el.closest(`.${params.slideClass}, swiper-slide`);
  if (!slide && swiper.isElement && path && path.length > 1 && path.includes(el)) {
    [...path.slice(path.indexOf(el) + 1, path.length)].forEach(pathEl => {
      if (!slide && pathEl.matches && pathEl.matches(`.${params.slideClass}, swiper-slide`)) {
        slide = pathEl;
      }
    });
  }
  let slideFound = false;
  let slideIndex;
  if (slide) {
    for (let i = 0; i < swiper.slides.length; i += 1) {
      if (swiper.slides[i] === slide) {
        slideFound = true;
        slideIndex = i;
        break;
      }
    }
  }
  if (slide && slideFound) {
    swiper.clickedSlide = slide;
    if (swiper.virtual && swiper.params.virtual.enabled) {
      swiper.clickedIndex = parseInt(slide.getAttribute('data-swiper-slide-index'), 10);
    } else {
      swiper.clickedIndex = slideIndex;
    }
  } else {
    swiper.clickedSlide = undefined;
    swiper.clickedIndex = undefined;
    return;
  }
  if (params.slideToClickedSlide && swiper.clickedIndex !== undefined && swiper.clickedIndex !== swiper.activeIndex) {
    swiper.slideToClickedSlide();
  }
}

var update = {
  updateSize,
  updateSlides,
  updateAutoHeight,
  updateSlidesOffset,
  updateSlidesProgress,
  updateProgress,
  updateSlidesClasses,
  updateActiveIndex,
  updateClickedSlide
};

function getSwiperTranslate(axis = this.isHorizontal() ? 'x' : 'y') {
  const swiper = this;
  const {
    params,
    rtlTranslate: rtl,
    translate,
    wrapperEl
  } = swiper;
  if (params.virtualTranslate) {
    return rtl ? -translate : translate;
  }
  if (params.cssMode) {
    return translate;
  }
  let currentTranslate = getTranslate(wrapperEl, axis);
  currentTranslate += swiper.cssOverflowAdjustment();
  if (rtl) currentTranslate = -currentTranslate;
  return currentTranslate || 0;
}

function setTranslate(translate, byController) {
  const swiper = this;
  const {
    rtlTranslate: rtl,
    params,
    wrapperEl,
    progress
  } = swiper;
  let x = 0;
  let y = 0;
  const z = 0;
  if (swiper.isHorizontal()) {
    x = rtl ? -translate : translate;
  } else {
    y = translate;
  }
  if (params.roundLengths) {
    x = Math.floor(x);
    y = Math.floor(y);
  }
  swiper.previousTranslate = swiper.translate;
  swiper.translate = swiper.isHorizontal() ? x : y;
  if (params.cssMode) {
    wrapperEl[swiper.isHorizontal() ? 'scrollLeft' : 'scrollTop'] = swiper.isHorizontal() ? -x : -y;
  } else if (!params.virtualTranslate) {
    if (swiper.isHorizontal()) {
      x -= swiper.cssOverflowAdjustment();
    } else {
      y -= swiper.cssOverflowAdjustment();
    }
    wrapperEl.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
  }

  // Check if we need to update progress
  let newProgress;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  if (translatesDiff === 0) {
    newProgress = 0;
  } else {
    newProgress = (translate - swiper.minTranslate()) / translatesDiff;
  }
  if (newProgress !== progress) {
    swiper.updateProgress(translate);
  }
  swiper.emit('setTranslate', swiper.translate, byController);
}

function minTranslate() {
  return -this.snapGrid[0];
}

function maxTranslate() {
  return -this.snapGrid[this.snapGrid.length - 1];
}

function translateTo(translate = 0, speed = this.params.speed, runCallbacks = true, translateBounds = true, internal) {
  const swiper = this;
  const {
    params,
    wrapperEl
  } = swiper;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return false;
  }
  const minTranslate = swiper.minTranslate();
  const maxTranslate = swiper.maxTranslate();
  let newTranslate;
  if (translateBounds && translate > minTranslate) newTranslate = minTranslate;else if (translateBounds && translate < maxTranslate) newTranslate = maxTranslate;else newTranslate = translate;

  // Update progress
  swiper.updateProgress(newTranslate);
  if (params.cssMode) {
    const isH = swiper.isHorizontal();
    if (speed === 0) {
      wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = -newTranslate;
    } else {
      if (!swiper.support.smoothScroll) {
        animateCSSModeScroll({
          swiper,
          targetPosition: -newTranslate,
          side: isH ? 'left' : 'top'
        });
        return true;
      }
      wrapperEl.scrollTo({
        [isH ? 'left' : 'top']: -newTranslate,
        behavior: 'smooth'
      });
    }
    return true;
  }
  if (speed === 0) {
    swiper.setTransition(0);
    swiper.setTranslate(newTranslate);
    if (runCallbacks) {
      swiper.emit('beforeTransitionStart', speed, internal);
      swiper.emit('transitionEnd');
    }
  } else {
    swiper.setTransition(speed);
    swiper.setTranslate(newTranslate);
    if (runCallbacks) {
      swiper.emit('beforeTransitionStart', speed, internal);
      swiper.emit('transitionStart');
    }
    if (!swiper.animating) {
      swiper.animating = true;
      if (!swiper.onTranslateToWrapperTransitionEnd) {
        swiper.onTranslateToWrapperTransitionEnd = function transitionEnd(e) {
          if (!swiper || swiper.destroyed) return;
          if (e.target !== this) return;
          swiper.wrapperEl.removeEventListener('transitionend', swiper.onTranslateToWrapperTransitionEnd);
          swiper.onTranslateToWrapperTransitionEnd = null;
          delete swiper.onTranslateToWrapperTransitionEnd;
          swiper.animating = false;
          if (runCallbacks) {
            swiper.emit('transitionEnd');
          }
        };
      }
      swiper.wrapperEl.addEventListener('transitionend', swiper.onTranslateToWrapperTransitionEnd);
    }
  }
  return true;
}

var translate = {
  getTranslate: getSwiperTranslate,
  setTranslate,
  minTranslate,
  maxTranslate,
  translateTo
};

function setTransition(duration, byController) {
  const swiper = this;
  if (!swiper.params.cssMode) {
    swiper.wrapperEl.style.transitionDuration = `${duration}ms`;
    swiper.wrapperEl.style.transitionDelay = duration === 0 ? `0ms` : '';
  }
  swiper.emit('setTransition', duration, byController);
}

function transitionEmit({
  swiper,
  runCallbacks,
  direction,
  step
}) {
  const {
    activeIndex,
    previousIndex
  } = swiper;
  let dir = direction;
  if (!dir) {
    if (activeIndex > previousIndex) dir = 'next';else if (activeIndex < previousIndex) dir = 'prev';else dir = 'reset';
  }
  swiper.emit(`transition${step}`);
  if (runCallbacks && dir === 'reset') {
    swiper.emit(`slideResetTransition${step}`);
  } else if (runCallbacks && activeIndex !== previousIndex) {
    swiper.emit(`slideChangeTransition${step}`);
    if (dir === 'next') {
      swiper.emit(`slideNextTransition${step}`);
    } else {
      swiper.emit(`slidePrevTransition${step}`);
    }
  }
}

function transitionStart(runCallbacks = true, direction) {
  const swiper = this;
  const {
    params
  } = swiper;
  if (params.cssMode) return;
  if (params.autoHeight) {
    swiper.updateAutoHeight();
  }
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: 'Start'
  });
}

function transitionEnd(runCallbacks = true, direction) {
  const swiper = this;
  const {
    params
  } = swiper;
  swiper.animating = false;
  if (params.cssMode) return;
  swiper.setTransition(0);
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: 'End'
  });
}

var transition = {
  setTransition,
  transitionStart,
  transitionEnd
};

function slideTo(index = 0, speed, runCallbacks = true, internal, initial) {
  if (typeof index === 'string') {
    index = parseInt(index, 10);
  }
  const swiper = this;
  let slideIndex = index;
  if (slideIndex < 0) slideIndex = 0;
  const {
    params,
    snapGrid,
    slidesGrid,
    previousIndex,
    activeIndex,
    rtlTranslate: rtl,
    wrapperEl,
    enabled
  } = swiper;
  if (!enabled && !internal && !initial || swiper.destroyed || swiper.animating && params.preventInteractionOnTransition) {
    return false;
  }
  if (typeof speed === 'undefined') {
    speed = swiper.params.speed;
  }
  const skip = Math.min(swiper.params.slidesPerGroupSkip, slideIndex);
  let snapIndex = skip + Math.floor((slideIndex - skip) / swiper.params.slidesPerGroup);
  if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
  const translate = -snapGrid[snapIndex];
  // Normalize slideIndex
  if (params.normalizeSlideIndex) {
    for (let i = 0; i < slidesGrid.length; i += 1) {
      const normalizedTranslate = -Math.floor(translate * 100);
      const normalizedGrid = Math.floor(slidesGrid[i] * 100);
      const normalizedGridNext = Math.floor(slidesGrid[i + 1] * 100);
      if (typeof slidesGrid[i + 1] !== 'undefined') {
        if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext - (normalizedGridNext - normalizedGrid) / 2) {
          slideIndex = i;
        } else if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext) {
          slideIndex = i + 1;
        }
      } else if (normalizedTranslate >= normalizedGrid) {
        slideIndex = i;
      }
    }
  }
  // Directions locks
  if (swiper.initialized && slideIndex !== activeIndex) {
    if (!swiper.allowSlideNext && (rtl ? translate > swiper.translate && translate > swiper.minTranslate() : translate < swiper.translate && translate < swiper.minTranslate())) {
      return false;
    }
    if (!swiper.allowSlidePrev && translate > swiper.translate && translate > swiper.maxTranslate()) {
      if ((activeIndex || 0) !== slideIndex) {
        return false;
      }
    }
  }
  if (slideIndex !== (previousIndex || 0) && runCallbacks) {
    swiper.emit('beforeSlideChangeStart');
  }

  // Update progress
  swiper.updateProgress(translate);
  let direction;
  if (slideIndex > activeIndex) direction = 'next';else if (slideIndex < activeIndex) direction = 'prev';else direction = 'reset';

  // initial virtual
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
  const isInitialVirtual = isVirtual && initial;
  // Update Index
  if (!isInitialVirtual && (rtl && -translate === swiper.translate || !rtl && translate === swiper.translate)) {
    swiper.updateActiveIndex(slideIndex);
    // Update Height
    if (params.autoHeight) {
      swiper.updateAutoHeight();
    }
    swiper.updateSlidesClasses();
    if (params.effect !== 'slide') {
      swiper.setTranslate(translate);
    }
    if (direction !== 'reset') {
      swiper.transitionStart(runCallbacks, direction);
      swiper.transitionEnd(runCallbacks, direction);
    }
    return false;
  }
  if (params.cssMode) {
    const isH = swiper.isHorizontal();
    const t = rtl ? translate : -translate;
    if (speed === 0) {
      if (isVirtual) {
        swiper.wrapperEl.style.scrollSnapType = 'none';
        swiper._immediateVirtual = true;
      }
      if (isVirtual && !swiper._cssModeVirtualInitialSet && swiper.params.initialSlide > 0) {
        swiper._cssModeVirtualInitialSet = true;
        requestAnimationFrame(() => {
          wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = t;
        });
      } else {
        wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = t;
      }
      if (isVirtual) {
        requestAnimationFrame(() => {
          swiper.wrapperEl.style.scrollSnapType = '';
          swiper._immediateVirtual = false;
        });
      }
    } else {
      if (!swiper.support.smoothScroll) {
        animateCSSModeScroll({
          swiper,
          targetPosition: t,
          side: isH ? 'left' : 'top'
        });
        return true;
      }
      wrapperEl.scrollTo({
        [isH ? 'left' : 'top']: t,
        behavior: 'smooth'
      });
    }
    return true;
  }
  const browser = getBrowser();
  const isSafari = browser.isSafari;
  if (isVirtual && !initial && isSafari && swiper.isElement) {
    swiper.virtual.update(false, false, slideIndex);
  }
  swiper.setTransition(speed);
  swiper.setTranslate(translate);
  swiper.updateActiveIndex(slideIndex);
  swiper.updateSlidesClasses();
  swiper.emit('beforeTransitionStart', speed, internal);
  swiper.transitionStart(runCallbacks, direction);
  if (speed === 0) {
    swiper.transitionEnd(runCallbacks, direction);
  } else if (!swiper.animating) {
    swiper.animating = true;
    if (!swiper.onSlideToWrapperTransitionEnd) {
      swiper.onSlideToWrapperTransitionEnd = function transitionEnd(e) {
        if (!swiper || swiper.destroyed) return;
        if (e.target !== this) return;
        swiper.wrapperEl.removeEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
        swiper.onSlideToWrapperTransitionEnd = null;
        delete swiper.onSlideToWrapperTransitionEnd;
        swiper.transitionEnd(runCallbacks, direction);
      };
    }
    swiper.wrapperEl.addEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
  }
  return true;
}

function slideToLoop(index = 0, speed, runCallbacks = true, internal) {
  if (typeof index === 'string') {
    const indexAsNumber = parseInt(index, 10);
    index = indexAsNumber;
  }
  const swiper = this;
  if (swiper.destroyed) return;
  if (typeof speed === 'undefined') {
    speed = swiper.params.speed;
  }
  const gridEnabled = swiper.grid && swiper.params.grid && swiper.params.grid.rows > 1;
  let newIndex = index;
  if (swiper.params.loop) {
    if (swiper.virtual && swiper.params.virtual.enabled) {
      // eslint-disable-next-line
      newIndex = newIndex + swiper.virtual.slidesBefore;
    } else {
      let targetSlideIndex;
      if (gridEnabled) {
        const slideIndex = newIndex * swiper.params.grid.rows;
        targetSlideIndex = swiper.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') * 1 === slideIndex).column;
      } else {
        targetSlideIndex = swiper.getSlideIndexByData(newIndex);
      }
      const cols = gridEnabled ? Math.ceil(swiper.slides.length / swiper.params.grid.rows) : swiper.slides.length;
      const {
        centeredSlides,
        slidesOffsetBefore,
        slidesOffsetAfter
      } = swiper.params;
      const bothDirections = centeredSlides || !!slidesOffsetBefore || !!slidesOffsetAfter;
      let slidesPerView = swiper.params.slidesPerView;
      if (slidesPerView === 'auto') {
        slidesPerView = swiper.slidesPerViewDynamic();
      } else {
        slidesPerView = Math.ceil(parseFloat(swiper.params.slidesPerView, 10));
        if (bothDirections && slidesPerView % 2 === 0) {
          slidesPerView = slidesPerView + 1;
        }
      }
      let needLoopFix = cols - targetSlideIndex < slidesPerView;
      if (bothDirections) {
        needLoopFix = needLoopFix || targetSlideIndex < Math.ceil(slidesPerView / 2);
      }
      if (internal && bothDirections && swiper.params.slidesPerView !== 'auto' && !gridEnabled) {
        needLoopFix = false;
      }
      if (needLoopFix) {
        const direction = bothDirections ? targetSlideIndex < swiper.activeIndex ? 'prev' : 'next' : targetSlideIndex - swiper.activeIndex - 1 < swiper.params.slidesPerView ? 'next' : 'prev';
        swiper.loopFix({
          direction,
          slideTo: true,
          activeSlideIndex: direction === 'next' ? targetSlideIndex + 1 : targetSlideIndex - cols + 1,
          slideRealIndex: direction === 'next' ? swiper.realIndex : undefined
        });
      }
      if (gridEnabled) {
        const slideIndex = newIndex * swiper.params.grid.rows;
        newIndex = swiper.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') * 1 === slideIndex).column;
      } else {
        newIndex = swiper.getSlideIndexByData(newIndex);
      }
    }
  }
  requestAnimationFrame(() => {
    swiper.slideTo(newIndex, speed, runCallbacks, internal);
  });
  return swiper;
}

/* eslint no-unused-vars: "off" */
function slideNext(speed, runCallbacks = true, internal) {
  const swiper = this;
  const {
    enabled,
    params,
    animating
  } = swiper;
  if (!enabled || swiper.destroyed) return swiper;
  if (typeof speed === 'undefined') {
    speed = swiper.params.speed;
  }
  let perGroup = params.slidesPerGroup;
  if (params.slidesPerView === 'auto' && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
    perGroup = Math.max(swiper.slidesPerViewDynamic('current', true), 1);
  }
  const increment = swiper.activeIndex < params.slidesPerGroupSkip ? 1 : perGroup;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  if (params.loop) {
    if (animating && !isVirtual && params.loopPreventsSliding) return false;
    swiper.loopFix({
      direction: 'next'
    });
    // eslint-disable-next-line
    swiper._clientLeft = swiper.wrapperEl.clientLeft;
    if (swiper.activeIndex === swiper.slides.length - 1 && params.cssMode) {
      requestAnimationFrame(() => {
        swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
      });
      return true;
    }
  }
  if (params.rewind && swiper.isEnd) {
    return swiper.slideTo(0, speed, runCallbacks, internal);
  }
  return swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
}

/* eslint no-unused-vars: "off" */
function slidePrev(speed, runCallbacks = true, internal) {
  const swiper = this;
  const {
    params,
    snapGrid,
    slidesGrid,
    rtlTranslate,
    enabled,
    animating
  } = swiper;
  if (!enabled || swiper.destroyed) return swiper;
  if (typeof speed === 'undefined') {
    speed = swiper.params.speed;
  }
  const isVirtual = swiper.virtual && params.virtual.enabled;
  if (params.loop) {
    if (animating && !isVirtual && params.loopPreventsSliding) return false;
    swiper.loopFix({
      direction: 'prev'
    });
    // eslint-disable-next-line
    swiper._clientLeft = swiper.wrapperEl.clientLeft;
  }
  const translate = rtlTranslate ? swiper.translate : -swiper.translate;
  function normalize(val) {
    if (val < 0) return -Math.floor(Math.abs(val));
    return Math.floor(val);
  }
  const normalizedTranslate = normalize(translate);
  const normalizedSnapGrid = snapGrid.map(val => normalize(val));
  const isFreeMode = params.freeMode && params.freeMode.enabled;
  let prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
  if (typeof prevSnap === 'undefined' && (params.cssMode || isFreeMode)) {
    let prevSnapIndex;
    snapGrid.forEach((snap, snapIndex) => {
      if (normalizedTranslate >= snap) {
        // prevSnap = snap;
        prevSnapIndex = snapIndex;
      }
    });
    if (typeof prevSnapIndex !== 'undefined') {
      prevSnap = isFreeMode ? snapGrid[prevSnapIndex] : snapGrid[prevSnapIndex > 0 ? prevSnapIndex - 1 : prevSnapIndex];
    }
  }
  let prevIndex = 0;
  if (typeof prevSnap !== 'undefined') {
    prevIndex = slidesGrid.indexOf(prevSnap);
    if (prevIndex < 0) prevIndex = swiper.activeIndex - 1;
    if (params.slidesPerView === 'auto' && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
      prevIndex = prevIndex - swiper.slidesPerViewDynamic('previous', true) + 1;
      prevIndex = Math.max(prevIndex, 0);
    }
  }
  if (params.rewind && swiper.isBeginning) {
    const lastIndex = swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
    return swiper.slideTo(lastIndex, speed, runCallbacks, internal);
  } else if (params.loop && swiper.activeIndex === 0 && params.cssMode) {
    requestAnimationFrame(() => {
      swiper.slideTo(prevIndex, speed, runCallbacks, internal);
    });
    return true;
  }
  return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
}

/* eslint no-unused-vars: "off" */
function slideReset(speed, runCallbacks = true, internal) {
  const swiper = this;
  if (swiper.destroyed) return;
  if (typeof speed === 'undefined') {
    speed = swiper.params.speed;
  }
  return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
}

/* eslint no-unused-vars: "off" */
function slideToClosest(speed, runCallbacks = true, internal, threshold = 0.5) {
  const swiper = this;
  if (swiper.destroyed) return;
  if (typeof speed === 'undefined') {
    speed = swiper.params.speed;
  }
  let index = swiper.activeIndex;
  const skip = Math.min(swiper.params.slidesPerGroupSkip, index);
  const snapIndex = skip + Math.floor((index - skip) / swiper.params.slidesPerGroup);
  const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  if (translate >= swiper.snapGrid[snapIndex]) {
    // The current translate is on or after the current snap index, so the choice
    // is between the current index and the one after it.
    const currentSnap = swiper.snapGrid[snapIndex];
    const nextSnap = swiper.snapGrid[snapIndex + 1];
    if (translate - currentSnap > (nextSnap - currentSnap) * threshold) {
      index += swiper.params.slidesPerGroup;
    }
  } else {
    // The current translate is before the current snap index, so the choice
    // is between the current index and the one before it.
    const prevSnap = swiper.snapGrid[snapIndex - 1];
    const currentSnap = swiper.snapGrid[snapIndex];
    if (translate - prevSnap <= (currentSnap - prevSnap) * threshold) {
      index -= swiper.params.slidesPerGroup;
    }
  }
  index = Math.max(index, 0);
  index = Math.min(index, swiper.slidesGrid.length - 1);
  return swiper.slideTo(index, speed, runCallbacks, internal);
}

function slideToClickedSlide() {
  const swiper = this;
  if (swiper.destroyed) return;
  const {
    params,
    slidesEl
  } = swiper;
  const slidesPerView = params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : params.slidesPerView;
  let slideToIndex = swiper.getSlideIndexWhenGrid(swiper.clickedIndex);
  let realIndex;
  const slideSelector = swiper.isElement ? `swiper-slide` : `.${params.slideClass}`;
  const isGrid = swiper.grid && swiper.params.grid && swiper.params.grid.rows > 1;
  if (params.loop) {
    if (swiper.animating) return;
    realIndex = parseInt(swiper.clickedSlide.getAttribute('data-swiper-slide-index'), 10);
    if (params.centeredSlides) {
      swiper.slideToLoop(realIndex);
    } else if (slideToIndex > (isGrid ? (swiper.slides.length - slidesPerView) / 2 - (swiper.params.grid.rows - 1) : swiper.slides.length - slidesPerView)) {
      swiper.loopFix();
      slideToIndex = swiper.getSlideIndex(elementChildren(slidesEl, `${slideSelector}[data-swiper-slide-index="${realIndex}"]`)[0]);
      nextTick(() => {
        swiper.slideTo(slideToIndex);
      });
    } else {
      swiper.slideTo(slideToIndex);
    }
  } else {
    swiper.slideTo(slideToIndex);
  }
}

var slide = {
  slideTo,
  slideToLoop,
  slideNext,
  slidePrev,
  slideReset,
  slideToClosest,
  slideToClickedSlide
};

function loopCreate(slideRealIndex, initial) {
  const swiper = this;
  const {
    params,
    slidesEl
  } = swiper;
  if (!params.loop || swiper.virtual && swiper.params.virtual.enabled) return;
  const initSlides = () => {
    const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
    slides.forEach((el, index) => {
      el.setAttribute('data-swiper-slide-index', index);
    });
  };
  const clearBlankSlides = () => {
    const slides = elementChildren(slidesEl, `.${params.slideBlankClass}`);
    slides.forEach(el => {
      el.remove();
    });
    if (slides.length > 0) {
      swiper.recalcSlides();
      swiper.updateSlides();
    }
  };
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  if (params.loopAddBlankSlides && (params.slidesPerGroup > 1 || gridEnabled)) {
    clearBlankSlides();
  }
  const slidesPerGroup = params.slidesPerGroup * (gridEnabled ? params.grid.rows : 1);
  const shouldFillGroup = swiper.slides.length % slidesPerGroup !== 0;
  const shouldFillGrid = gridEnabled && swiper.slides.length % params.grid.rows !== 0;
  const addBlankSlides = amountOfSlides => {
    for (let i = 0; i < amountOfSlides; i += 1) {
      const slideEl = swiper.isElement ? createElement('swiper-slide', [params.slideBlankClass]) : createElement('div', [params.slideClass, params.slideBlankClass]);
      swiper.slidesEl.append(slideEl);
    }
  };
  if (shouldFillGroup) {
    if (params.loopAddBlankSlides) {
      const slidesToAdd = slidesPerGroup - swiper.slides.length % slidesPerGroup;
      addBlankSlides(slidesToAdd);
      swiper.recalcSlides();
      swiper.updateSlides();
    } else {
      showWarning('Swiper Loop Warning: The number of slides is not even to slidesPerGroup, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)');
    }
    initSlides();
  } else if (shouldFillGrid) {
    if (params.loopAddBlankSlides) {
      const slidesToAdd = params.grid.rows - swiper.slides.length % params.grid.rows;
      addBlankSlides(slidesToAdd);
      swiper.recalcSlides();
      swiper.updateSlides();
    } else {
      showWarning('Swiper Loop Warning: The number of slides is not even to grid.rows, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)');
    }
    initSlides();
  } else {
    initSlides();
  }
  const bothDirections = params.centeredSlides || !!params.slidesOffsetBefore || !!params.slidesOffsetAfter;
  swiper.loopFix({
    slideRealIndex,
    direction: bothDirections ? undefined : 'next',
    initial
  });
}

function loopFix({
  slideRealIndex,
  slideTo = true,
  direction,
  setTranslate,
  activeSlideIndex,
  initial,
  byController,
  byMousewheel
} = {}) {
  const swiper = this;
  if (!swiper.params.loop) return;
  swiper.emit('beforeLoopFix');
  const {
    slides,
    allowSlidePrev,
    allowSlideNext,
    slidesEl,
    params
  } = swiper;
  const {
    centeredSlides,
    slidesOffsetBefore,
    slidesOffsetAfter,
    initialSlide
  } = params;
  const bothDirections = centeredSlides || !!slidesOffsetBefore || !!slidesOffsetAfter;
  swiper.allowSlidePrev = true;
  swiper.allowSlideNext = true;
  if (swiper.virtual && params.virtual.enabled) {
    if (slideTo) {
      if (!bothDirections && swiper.snapIndex === 0) {
        swiper.slideTo(swiper.virtual.slides.length, 0, false, true);
      } else if (bothDirections && swiper.snapIndex < params.slidesPerView) {
        swiper.slideTo(swiper.virtual.slides.length + swiper.snapIndex, 0, false, true);
      } else if (swiper.snapIndex === swiper.snapGrid.length - 1) {
        swiper.slideTo(swiper.virtual.slidesBefore, 0, false, true);
      }
    }
    swiper.allowSlidePrev = allowSlidePrev;
    swiper.allowSlideNext = allowSlideNext;
    swiper.emit('loopFix');
    return;
  }
  let slidesPerView = params.slidesPerView;
  if (slidesPerView === 'auto') {
    slidesPerView = swiper.slidesPerViewDynamic();
  } else {
    slidesPerView = Math.ceil(parseFloat(params.slidesPerView, 10));
    if (bothDirections && slidesPerView % 2 === 0) {
      slidesPerView = slidesPerView + 1;
    }
  }
  const slidesPerGroup = params.slidesPerGroupAuto ? slidesPerView : params.slidesPerGroup;
  let loopedSlides = bothDirections ? Math.max(slidesPerGroup, Math.ceil(slidesPerView / 2)) : slidesPerGroup;
  if (loopedSlides % slidesPerGroup !== 0) {
    loopedSlides += slidesPerGroup - loopedSlides % slidesPerGroup;
  }
  loopedSlides += params.loopAdditionalSlides;
  swiper.loopedSlides = loopedSlides;
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  if (slides.length < slidesPerView + loopedSlides || swiper.params.effect === 'cards' && slides.length < slidesPerView + loopedSlides * 2) {
    showWarning('Swiper Loop Warning: The number of slides is not enough for loop mode, it will be disabled or not function properly. You need to add more slides (or make duplicates) or lower the values of slidesPerView and slidesPerGroup parameters');
  } else if (gridEnabled && params.grid.fill === 'row') {
    showWarning('Swiper Loop Warning: Loop mode is not compatible with grid.fill = `row`');
  }
  const prependSlidesIndexes = [];
  const appendSlidesIndexes = [];
  const cols = gridEnabled ? Math.ceil(slides.length / params.grid.rows) : slides.length;
  const isInitialOverflow = initial && cols - initialSlide < slidesPerView && !bothDirections;
  let activeIndex = isInitialOverflow ? initialSlide : swiper.activeIndex;
  if (typeof activeSlideIndex === 'undefined') {
    activeSlideIndex = swiper.getSlideIndex(slides.find(el => el.classList.contains(params.slideActiveClass)));
  } else {
    activeIndex = activeSlideIndex;
  }
  const isNext = direction === 'next' || !direction;
  const isPrev = direction === 'prev' || !direction;
  let slidesPrepended = 0;
  let slidesAppended = 0;
  const activeColIndex = gridEnabled ? slides[activeSlideIndex].column : activeSlideIndex;
  const activeColIndexWithShift = activeColIndex + (bothDirections && typeof setTranslate === 'undefined' ? -slidesPerView / 2 + 0.5 : 0);
  // prepend last slides before start
  if (activeColIndexWithShift < loopedSlides) {
    slidesPrepended = Math.max(loopedSlides - activeColIndexWithShift, slidesPerGroup);
    for (let i = 0; i < loopedSlides - activeColIndexWithShift; i += 1) {
      const index = i - Math.floor(i / cols) * cols;
      if (gridEnabled) {
        const colIndexToPrepend = cols - index - 1;
        for (let i = slides.length - 1; i >= 0; i -= 1) {
          if (slides[i].column === colIndexToPrepend) prependSlidesIndexes.push(i);
        }
        // slides.forEach((slide, slideIndex) => {
        //   if (slide.column === colIndexToPrepend) prependSlidesIndexes.push(slideIndex);
        // });
      } else {
        prependSlidesIndexes.push(cols - index - 1);
      }
    }
  } else if (activeColIndexWithShift + slidesPerView > cols - loopedSlides) {
    slidesAppended = Math.max(activeColIndexWithShift - (cols - loopedSlides * 2), slidesPerGroup);
    if (isInitialOverflow) {
      slidesAppended = Math.max(slidesAppended, slidesPerView - cols + initialSlide + 1);
    }
    for (let i = 0; i < slidesAppended; i += 1) {
      const index = i - Math.floor(i / cols) * cols;
      if (gridEnabled) {
        slides.forEach((slide, slideIndex) => {
          if (slide.column === index) appendSlidesIndexes.push(slideIndex);
        });
      } else {
        appendSlidesIndexes.push(index);
      }
    }
  }
  swiper.__preventObserver__ = true;
  requestAnimationFrame(() => {
    swiper.__preventObserver__ = false;
  });
  if (swiper.params.effect === 'cards' && slides.length < slidesPerView + loopedSlides * 2) {
    if (appendSlidesIndexes.includes(activeSlideIndex)) {
      appendSlidesIndexes.splice(appendSlidesIndexes.indexOf(activeSlideIndex), 1);
    }
    if (prependSlidesIndexes.includes(activeSlideIndex)) {
      prependSlidesIndexes.splice(prependSlidesIndexes.indexOf(activeSlideIndex), 1);
    }
  }
  if (isPrev) {
    prependSlidesIndexes.forEach(index => {
      slides[index].swiperLoopMoveDOM = true;
      slidesEl.prepend(slides[index]);
      slides[index].swiperLoopMoveDOM = false;
    });
  }
  if (isNext) {
    appendSlidesIndexes.forEach(index => {
      slides[index].swiperLoopMoveDOM = true;
      slidesEl.append(slides[index]);
      slides[index].swiperLoopMoveDOM = false;
    });
  }
  swiper.recalcSlides();
  if (params.slidesPerView === 'auto') {
    swiper.updateSlides();
  } else if (gridEnabled && (prependSlidesIndexes.length > 0 && isPrev || appendSlidesIndexes.length > 0 && isNext)) {
    swiper.slides.forEach((slide, slideIndex) => {
      swiper.grid.updateSlide(slideIndex, slide, swiper.slides);
    });
  }
  if (params.watchSlidesProgress) {
    swiper.updateSlidesOffset();
  }
  if (slideTo) {
    if (prependSlidesIndexes.length > 0 && isPrev) {
      if (typeof slideRealIndex === 'undefined') {
        const currentSlideTranslate = swiper.slidesGrid[activeIndex];
        const newSlideTranslate = swiper.slidesGrid[activeIndex + slidesPrepended];
        const diff = newSlideTranslate - currentSlideTranslate;
        if (byMousewheel) {
          swiper.setTranslate(swiper.translate - diff);
        } else {
          swiper.slideTo(activeIndex + Math.ceil(slidesPrepended), 0, false, true);
          if (setTranslate) {
            swiper.touchEventsData.startTranslate = swiper.touchEventsData.startTranslate - diff;
            swiper.touchEventsData.currentTranslate = swiper.touchEventsData.currentTranslate - diff;
          }
        }
      } else {
        if (setTranslate) {
          const shift = gridEnabled ? prependSlidesIndexes.length / params.grid.rows : prependSlidesIndexes.length;
          swiper.slideTo(swiper.activeIndex + shift, 0, false, true);
          swiper.touchEventsData.currentTranslate = swiper.translate;
        }
      }
    } else if (appendSlidesIndexes.length > 0 && isNext) {
      if (typeof slideRealIndex === 'undefined') {
        const currentSlideTranslate = swiper.slidesGrid[activeIndex];
        const newSlideTranslate = swiper.slidesGrid[activeIndex - slidesAppended];
        const diff = newSlideTranslate - currentSlideTranslate;
        if (byMousewheel) {
          swiper.setTranslate(swiper.translate - diff);
        } else {
          swiper.slideTo(activeIndex - slidesAppended, 0, false, true);
          if (setTranslate) {
            swiper.touchEventsData.startTranslate = swiper.touchEventsData.startTranslate - diff;
            swiper.touchEventsData.currentTranslate = swiper.touchEventsData.currentTranslate - diff;
          }
        }
      } else {
        const shift = gridEnabled ? appendSlidesIndexes.length / params.grid.rows : appendSlidesIndexes.length;
        swiper.slideTo(swiper.activeIndex - shift, 0, false, true);
      }
    }
  }
  swiper.allowSlidePrev = allowSlidePrev;
  swiper.allowSlideNext = allowSlideNext;
  if (swiper.controller && swiper.controller.control && !byController) {
    const loopParams = {
      slideRealIndex,
      direction,
      setTranslate,
      activeSlideIndex,
      byController: true
    };
    if (Array.isArray(swiper.controller.control)) {
      swiper.controller.control.forEach(c => {
        if (!c.destroyed && c.params.loop) c.loopFix({
          ...loopParams,
          slideTo: c.params.slidesPerView === params.slidesPerView ? slideTo : false
        });
      });
    } else if (swiper.controller.control instanceof swiper.constructor && swiper.controller.control.params.loop) {
      swiper.controller.control.loopFix({
        ...loopParams,
        slideTo: swiper.controller.control.params.slidesPerView === params.slidesPerView ? slideTo : false
      });
    }
  }
  swiper.emit('loopFix');
}

function loopDestroy() {
  const swiper = this;
  const {
    params,
    slidesEl
  } = swiper;
  if (!params.loop || !slidesEl || swiper.virtual && swiper.params.virtual.enabled) return;
  swiper.recalcSlides();
  const newSlidesOrder = [];
  swiper.slides.forEach(slideEl => {
    const index = typeof slideEl.swiperSlideIndex === 'undefined' ? slideEl.getAttribute('data-swiper-slide-index') * 1 : slideEl.swiperSlideIndex;
    newSlidesOrder[index] = slideEl;
  });
  swiper.slides.forEach(slideEl => {
    slideEl.removeAttribute('data-swiper-slide-index');
  });
  newSlidesOrder.forEach(slideEl => {
    slidesEl.append(slideEl);
  });
  swiper.recalcSlides();
  swiper.slideTo(swiper.realIndex, 0);
}

var loop = {
  loopCreate,
  loopFix,
  loopDestroy
};

function setGrabCursor(moving) {
  const swiper = this;
  if (!swiper.params.simulateTouch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) return;
  const el = swiper.params.touchEventsTarget === 'container' ? swiper.el : swiper.wrapperEl;
  if (swiper.isElement) {
    swiper.__preventObserver__ = true;
  }
  el.style.cursor = 'move';
  el.style.cursor = moving ? 'grabbing' : 'grab';
  if (swiper.isElement) {
    requestAnimationFrame(() => {
      swiper.__preventObserver__ = false;
    });
  }
}

function unsetGrabCursor() {
  const swiper = this;
  if (swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) {
    return;
  }
  if (swiper.isElement) {
    swiper.__preventObserver__ = true;
  }
  swiper[swiper.params.touchEventsTarget === 'container' ? 'el' : 'wrapperEl'].style.cursor = '';
  if (swiper.isElement) {
    requestAnimationFrame(() => {
      swiper.__preventObserver__ = false;
    });
  }
}

var grabCursor = {
  setGrabCursor,
  unsetGrabCursor
};

// Modified from https://stackoverflow.com/questions/54520554/custom-element-getrootnode-closest-function-crossing-multiple-parent-shadowd
function closestElement(selector, base = this) {
  function __closestFrom(el) {
    if (!el || el === getDocument() || el === getWindow()) return null;
    if (el.assignedSlot) el = el.assignedSlot;
    const found = el.closest(selector);
    if (!found && !el.getRootNode) {
      return null;
    }
    return found || __closestFrom(el.getRootNode().host);
  }
  return __closestFrom(base);
}
function preventEdgeSwipe(swiper, event, startX) {
  const window = getWindow();
  const {
    params
  } = swiper;
  const edgeSwipeDetection = params.edgeSwipeDetection;
  const edgeSwipeThreshold = params.edgeSwipeThreshold;
  if (edgeSwipeDetection && (startX <= edgeSwipeThreshold || startX >= window.innerWidth - edgeSwipeThreshold)) {
    if (edgeSwipeDetection === 'prevent') {
      event.preventDefault();
      return true;
    }
    return false;
  }
  return true;
}
function onTouchStart(event) {
  const swiper = this;
  const document = getDocument();
  let e = event;
  if (e.originalEvent) e = e.originalEvent;
  const data = swiper.touchEventsData;
  if (e.type === 'pointerdown') {
    if (data.pointerId !== null && data.pointerId !== e.pointerId) {
      return;
    }
    data.pointerId = e.pointerId;
  } else if (e.type === 'touchstart' && e.targetTouches.length === 1) {
    data.touchId = e.targetTouches[0].identifier;
  }
  if (e.type === 'touchstart') {
    // don't proceed touch event
    preventEdgeSwipe(swiper, e, e.targetTouches[0].pageX);
    return;
  }
  const {
    params,
    touches,
    enabled
  } = swiper;
  if (!enabled) return;
  if (!params.simulateTouch && e.pointerType === 'mouse') return;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return;
  }
  if (!swiper.animating && params.cssMode && params.loop) {
    swiper.loopFix();
  }
  let targetEl = e.target;
  if (params.touchEventsTarget === 'wrapper') {
    if (!elementIsChildOf(targetEl, swiper.wrapperEl)) return;
  }
  if ('which' in e && e.which === 3) return;
  if ('button' in e && e.button > 0) return;
  if (data.isTouched && data.isMoved) return;

  // change target el for shadow root component
  const swipingClassHasValue = !!params.noSwipingClass && params.noSwipingClass !== '';
  // eslint-disable-next-line
  const eventPath = e.composedPath ? e.composedPath() : e.path;
  if (swipingClassHasValue && e.target && e.target.shadowRoot && eventPath) {
    targetEl = eventPath[0];
  }
  const noSwipingSelector = params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`;
  const isTargetShadow = !!(e.target && e.target.shadowRoot);

  // use closestElement for shadow root element to get the actual closest for nested shadow root element
  if (params.noSwiping && (isTargetShadow ? closestElement(noSwipingSelector, targetEl) : targetEl.closest(noSwipingSelector))) {
    swiper.allowClick = true;
    return;
  }
  if (params.swipeHandler) {
    if (!targetEl.closest(params.swipeHandler)) return;
  }
  touches.currentX = e.pageX;
  touches.currentY = e.pageY;
  const startX = touches.currentX;
  const startY = touches.currentY;

  // Do NOT start if iOS edge swipe is detected. Otherwise iOS app cannot swipe-to-go-back anymore

  if (!preventEdgeSwipe(swiper, e, startX)) {
    return;
  }
  Object.assign(data, {
    isTouched: true,
    isMoved: false,
    allowTouchCallbacks: true,
    isScrolling: undefined,
    startMoving: undefined
  });
  touches.startX = startX;
  touches.startY = startY;
  data.touchStartTime = now();
  swiper.allowClick = true;
  swiper.updateSize();
  swiper.swipeDirection = undefined;
  if (params.threshold > 0) data.allowThresholdMove = false;
  let preventDefault = true;
  if (targetEl.matches(data.focusableElements)) {
    preventDefault = false;
    if (targetEl.nodeName === 'SELECT') {
      data.isTouched = false;
    }
  }
  if (document.activeElement && document.activeElement.matches(data.focusableElements) && document.activeElement !== targetEl && (e.pointerType === 'mouse' || e.pointerType !== 'mouse' && !targetEl.matches(data.focusableElements))) {
    document.activeElement.blur();
  }
  const shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;
  if ((params.touchStartForcePreventDefault || shouldPreventDefault) && !targetEl.isContentEditable) {
    e.preventDefault();
  }
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode && swiper.animating && !params.cssMode) {
    swiper.freeMode.onTouchStart();
  }
  swiper.emit('touchStart', e);
}

function onTouchMove(event) {
  const document = getDocument();
  const swiper = this;
  const data = swiper.touchEventsData;
  const {
    params,
    touches,
    rtlTranslate: rtl,
    enabled
  } = swiper;
  if (!enabled) return;
  if (!params.simulateTouch && event.pointerType === 'mouse') return;
  let e = event;
  if (e.originalEvent) e = e.originalEvent;
  if (e.type === 'pointermove') {
    if (data.touchId !== null) return; // return from pointer if we use touch
    const id = e.pointerId;
    if (id !== data.pointerId) return;
  }
  let targetTouch;
  if (e.type === 'touchmove') {
    targetTouch = [...e.changedTouches].find(t => t.identifier === data.touchId);
    if (!targetTouch || targetTouch.identifier !== data.touchId) return;
  } else {
    targetTouch = e;
  }
  if (!data.isTouched) {
    if (data.startMoving && data.isScrolling) {
      swiper.emit('touchMoveOpposite', e);
    }
    return;
  }
  const pageX = targetTouch.pageX;
  const pageY = targetTouch.pageY;
  if (e.preventedByNestedSwiper) {
    touches.startX = pageX;
    touches.startY = pageY;
    return;
  }
  if (!swiper.allowTouchMove) {
    if (!e.target.matches(data.focusableElements)) {
      swiper.allowClick = false;
    }
    if (data.isTouched) {
      Object.assign(touches, {
        startX: pageX,
        startY: pageY,
        currentX: pageX,
        currentY: pageY
      });
      data.touchStartTime = now();
    }
    return;
  }
  if (params.touchReleaseOnEdges && !params.loop) {
    if (swiper.isVertical()) {
      // Vertical
      if (pageY < touches.startY && swiper.translate <= swiper.maxTranslate() || pageY > touches.startY && swiper.translate >= swiper.minTranslate()) {
        data.isTouched = false;
        data.isMoved = false;
        return;
      }
    } else if (rtl && (pageX > touches.startX && -swiper.translate <= swiper.maxTranslate() || pageX < touches.startX && -swiper.translate >= swiper.minTranslate())) {
      return;
    } else if (!rtl && (pageX < touches.startX && swiper.translate <= swiper.maxTranslate() || pageX > touches.startX && swiper.translate >= swiper.minTranslate())) {
      return;
    }
  }
  if (document.activeElement && document.activeElement.matches(data.focusableElements) && document.activeElement !== e.target && e.pointerType !== 'mouse') {
    document.activeElement.blur();
  }
  if (document.activeElement) {
    if (e.target === document.activeElement && e.target.matches(data.focusableElements)) {
      data.isMoved = true;
      swiper.allowClick = false;
      return;
    }
  }
  if (data.allowTouchCallbacks) {
    swiper.emit('touchMove', e);
  }
  touches.previousX = touches.currentX;
  touches.previousY = touches.currentY;
  touches.currentX = pageX;
  touches.currentY = pageY;
  const diffX = touches.currentX - touches.startX;
  const diffY = touches.currentY - touches.startY;
  if (swiper.params.threshold && Math.sqrt(diffX ** 2 + diffY ** 2) < swiper.params.threshold) return;
  if (typeof data.isScrolling === 'undefined') {
    let touchAngle;
    if (swiper.isHorizontal() && touches.currentY === touches.startY || swiper.isVertical() && touches.currentX === touches.startX) {
      data.isScrolling = false;
    } else {
      // eslint-disable-next-line
      if (diffX * diffX + diffY * diffY >= 25) {
        touchAngle = Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180 / Math.PI;
        data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : 90 - touchAngle > params.touchAngle;
      }
    }
  }
  if (data.isScrolling) {
    swiper.emit('touchMoveOpposite', e);
  }
  if (typeof data.startMoving === 'undefined') {
    if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
      data.startMoving = true;
    }
  }
  if (data.isScrolling || e.type === 'touchmove' && data.preventTouchMoveFromPointerMove) {
    data.isTouched = false;
    return;
  }
  if (!data.startMoving) {
    return;
  }
  swiper.allowClick = false;
  if (!params.cssMode && e.cancelable) {
    e.preventDefault();
  }
  if (params.touchMoveStopPropagation && !params.nested) {
    e.stopPropagation();
  }
  let diff = swiper.isHorizontal() ? diffX : diffY;
  let touchesDiff = swiper.isHorizontal() ? touches.currentX - touches.previousX : touches.currentY - touches.previousY;
  if (params.oneWayMovement) {
    diff = Math.abs(diff) * (rtl ? 1 : -1);
    touchesDiff = Math.abs(touchesDiff) * (rtl ? 1 : -1);
  }
  touches.diff = diff;
  diff *= params.touchRatio;
  if (rtl) {
    diff = -diff;
    touchesDiff = -touchesDiff;
  }
  const prevTouchesDirection = swiper.touchesDirection;
  swiper.swipeDirection = diff > 0 ? 'prev' : 'next';
  swiper.touchesDirection = touchesDiff > 0 ? 'prev' : 'next';
  const isLoop = swiper.params.loop && !params.cssMode;
  const allowLoopFix = swiper.touchesDirection === 'next' && swiper.allowSlideNext || swiper.touchesDirection === 'prev' && swiper.allowSlidePrev;
  if (!data.isMoved) {
    if (isLoop && allowLoopFix) {
      swiper.loopFix({
        direction: swiper.swipeDirection
      });
    }
    data.startTranslate = swiper.getTranslate();
    swiper.setTransition(0);
    if (swiper.animating) {
      const evt = new window.CustomEvent('transitionend', {
        bubbles: true,
        cancelable: true,
        detail: {
          bySwiperTouchMove: true
        }
      });
      swiper.wrapperEl.dispatchEvent(evt);
    }
    data.allowMomentumBounce = false;
    // Grab Cursor
    if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
      swiper.setGrabCursor(true);
    }
    swiper.emit('sliderFirstMove', e);
  }
  new Date().getTime();
  if (params._loopSwapReset !== false && data.isMoved && data.allowThresholdMove && prevTouchesDirection !== swiper.touchesDirection && isLoop && allowLoopFix && Math.abs(diff) >= 1) {
    Object.assign(touches, {
      startX: pageX,
      startY: pageY,
      currentX: pageX,
      currentY: pageY,
      startTranslate: data.currentTranslate
    });
    data.loopSwapReset = true;
    data.startTranslate = data.currentTranslate;
    return;
  }
  swiper.emit('sliderMove', e);
  data.isMoved = true;
  data.currentTranslate = diff + data.startTranslate;
  let disableParentSwiper = true;
  let resistanceRatio = params.resistanceRatio;
  if (params.touchReleaseOnEdges) {
    resistanceRatio = 0;
  }
  if (diff > 0) {
    if (isLoop && allowLoopFix && true && data.allowThresholdMove && data.currentTranslate > (params.centeredSlides ? swiper.minTranslate() - swiper.slidesSizesGrid[swiper.activeIndex + 1] - (params.slidesPerView !== 'auto' && swiper.slides.length - params.slidesPerView >= 2 ? swiper.slidesSizesGrid[swiper.activeIndex + 1] + swiper.params.spaceBetween : 0) - swiper.params.spaceBetween : swiper.minTranslate())) {
      swiper.loopFix({
        direction: 'prev',
        setTranslate: true,
        activeSlideIndex: 0
      });
    }
    if (data.currentTranslate > swiper.minTranslate()) {
      disableParentSwiper = false;
      if (params.resistance) {
        data.currentTranslate = swiper.minTranslate() - 1 + (-swiper.minTranslate() + data.startTranslate + diff) ** resistanceRatio;
      }
    }
  } else if (diff < 0) {
    if (isLoop && allowLoopFix && true && data.allowThresholdMove && data.currentTranslate < (params.centeredSlides ? swiper.maxTranslate() + swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1] + swiper.params.spaceBetween + (params.slidesPerView !== 'auto' && swiper.slides.length - params.slidesPerView >= 2 ? swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1] + swiper.params.spaceBetween : 0) : swiper.maxTranslate())) {
      swiper.loopFix({
        direction: 'next',
        setTranslate: true,
        activeSlideIndex: swiper.slides.length - (params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : Math.ceil(parseFloat(params.slidesPerView, 10)))
      });
    }
    if (data.currentTranslate < swiper.maxTranslate()) {
      disableParentSwiper = false;
      if (params.resistance) {
        data.currentTranslate = swiper.maxTranslate() + 1 - (swiper.maxTranslate() - data.startTranslate - diff) ** resistanceRatio;
      }
    }
  }
  if (disableParentSwiper) {
    e.preventedByNestedSwiper = true;
  }

  // Directions locks
  if (!swiper.allowSlideNext && swiper.swipeDirection === 'next' && data.currentTranslate < data.startTranslate) {
    data.currentTranslate = data.startTranslate;
  }
  if (!swiper.allowSlidePrev && swiper.swipeDirection === 'prev' && data.currentTranslate > data.startTranslate) {
    data.currentTranslate = data.startTranslate;
  }
  if (!swiper.allowSlidePrev && !swiper.allowSlideNext) {
    data.currentTranslate = data.startTranslate;
  }

  // Threshold
  if (params.threshold > 0) {
    if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
      if (!data.allowThresholdMove) {
        data.allowThresholdMove = true;
        touches.startX = touches.currentX;
        touches.startY = touches.currentY;
        data.currentTranslate = data.startTranslate;
        touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
        return;
      }
    } else {
      data.currentTranslate = data.startTranslate;
      return;
    }
  }
  if (!params.followFinger || params.cssMode) return;

  // Update active index in free mode
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode || params.watchSlidesProgress) {
    swiper.updateActiveIndex();
    swiper.updateSlidesClasses();
  }
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode) {
    swiper.freeMode.onTouchMove();
  }
  // Update progress
  swiper.updateProgress(data.currentTranslate);
  // Update translate
  swiper.setTranslate(data.currentTranslate);
}

function onTouchEnd(event) {
  const swiper = this;
  const data = swiper.touchEventsData;
  let e = event;
  if (e.originalEvent) e = e.originalEvent;
  let targetTouch;
  const isTouchEvent = e.type === 'touchend' || e.type === 'touchcancel';
  if (!isTouchEvent) {
    if (data.touchId !== null) return; // return from pointer if we use touch
    if (e.pointerId !== data.pointerId) return;
    targetTouch = e;
  } else {
    targetTouch = [...e.changedTouches].find(t => t.identifier === data.touchId);
    if (!targetTouch || targetTouch.identifier !== data.touchId) return;
  }
  if (['pointercancel', 'pointerout', 'pointerleave', 'contextmenu'].includes(e.type)) {
    const proceed = ['pointercancel', 'contextmenu'].includes(e.type) && (swiper.browser.isSafari || swiper.browser.isWebView);
    if (!proceed) {
      return;
    }
  }
  data.pointerId = null;
  data.touchId = null;
  const {
    params,
    touches,
    rtlTranslate: rtl,
    slidesGrid,
    enabled
  } = swiper;
  if (!enabled) return;
  if (!params.simulateTouch && e.pointerType === 'mouse') return;
  if (data.allowTouchCallbacks) {
    swiper.emit('touchEnd', e);
  }
  data.allowTouchCallbacks = false;
  if (!data.isTouched) {
    if (data.isMoved && params.grabCursor) {
      swiper.setGrabCursor(false);
    }
    data.isMoved = false;
    data.startMoving = false;
    return;
  }

  // Return Grab Cursor
  if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
    swiper.setGrabCursor(false);
  }

  // Time diff
  const touchEndTime = now();
  const timeDiff = touchEndTime - data.touchStartTime;

  // Tap, doubleTap, Click
  if (swiper.allowClick) {
    const pathTree = e.path || e.composedPath && e.composedPath();
    swiper.updateClickedSlide(pathTree && pathTree[0] || e.target, pathTree);
    swiper.emit('tap click', e);
    if (timeDiff < 300 && touchEndTime - data.lastClickTime < 300) {
      swiper.emit('doubleTap doubleClick', e);
    }
  }
  data.lastClickTime = now();
  nextTick(() => {
    if (!swiper.destroyed) swiper.allowClick = true;
  });
  if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 && !data.loopSwapReset || data.currentTranslate === data.startTranslate && !data.loopSwapReset) {
    data.isTouched = false;
    data.isMoved = false;
    data.startMoving = false;
    return;
  }
  data.isTouched = false;
  data.isMoved = false;
  data.startMoving = false;
  let currentPos;
  if (params.followFinger) {
    currentPos = rtl ? swiper.translate : -swiper.translate;
  } else {
    currentPos = -data.currentTranslate;
  }
  if (params.cssMode) {
    return;
  }
  if (params.freeMode && params.freeMode.enabled) {
    swiper.freeMode.onTouchEnd({
      currentPos
    });
    return;
  }

  // Find current slide
  const swipeToLast = currentPos >= -swiper.maxTranslate() && !swiper.params.loop;
  let stopIndex = 0;
  let groupSize = swiper.slidesSizesGrid[0];
  for (let i = 0; i < slidesGrid.length; i += i < params.slidesPerGroupSkip ? 1 : params.slidesPerGroup) {
    const increment = i < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
    if (typeof slidesGrid[i + increment] !== 'undefined') {
      if (swipeToLast || currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + increment]) {
        stopIndex = i;
        groupSize = slidesGrid[i + increment] - slidesGrid[i];
      }
    } else if (swipeToLast || currentPos >= slidesGrid[i]) {
      stopIndex = i;
      groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
    }
  }
  let rewindFirstIndex = null;
  let rewindLastIndex = null;
  if (params.rewind) {
    if (swiper.isBeginning) {
      rewindLastIndex = params.virtual && params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
    } else if (swiper.isEnd) {
      rewindFirstIndex = 0;
    }
  }
  // Find current slide size
  const ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;
  const increment = stopIndex < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
  if (timeDiff > params.longSwipesMs) {
    // Long touches
    if (!params.longSwipes) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    if (swiper.swipeDirection === 'next') {
      if (ratio >= params.longSwipesRatio) swiper.slideTo(params.rewind && swiper.isEnd ? rewindFirstIndex : stopIndex + increment);else swiper.slideTo(stopIndex);
    }
    if (swiper.swipeDirection === 'prev') {
      if (ratio > 1 - params.longSwipesRatio) {
        swiper.slideTo(stopIndex + increment);
      } else if (rewindLastIndex !== null && ratio < 0 && Math.abs(ratio) > params.longSwipesRatio) {
        swiper.slideTo(rewindLastIndex);
      } else {
        swiper.slideTo(stopIndex);
      }
    }
  } else {
    // Short swipes
    if (!params.shortSwipes) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    const isNavButtonTarget = swiper.navigation && (e.target === swiper.navigation.nextEl || e.target === swiper.navigation.prevEl);
    if (!isNavButtonTarget) {
      if (swiper.swipeDirection === 'next') {
        swiper.slideTo(rewindFirstIndex !== null ? rewindFirstIndex : stopIndex + increment);
      }
      if (swiper.swipeDirection === 'prev') {
        swiper.slideTo(rewindLastIndex !== null ? rewindLastIndex : stopIndex);
      }
    } else if (e.target === swiper.navigation.nextEl) {
      swiper.slideTo(stopIndex + increment);
    } else {
      swiper.slideTo(stopIndex);
    }
  }
}

function onResize() {
  const swiper = this;
  const {
    params,
    el
  } = swiper;
  if (el && el.offsetWidth === 0) return;

  // Breakpoints
  if (params.breakpoints) {
    swiper.setBreakpoint();
  }

  // Save locks
  const {
    allowSlideNext,
    allowSlidePrev,
    snapGrid
  } = swiper;
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;

  // Disable locks on resize
  swiper.allowSlideNext = true;
  swiper.allowSlidePrev = true;
  swiper.updateSize();
  swiper.updateSlides();
  swiper.updateSlidesClasses();
  const isVirtualLoop = isVirtual && params.loop;
  if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !swiper.isBeginning && !swiper.params.centeredSlides && !isVirtualLoop) {
    const slides = isVirtual ? swiper.virtual.slides : swiper.slides;
    swiper.slideTo(slides.length - 1, 0, false, true);
  } else {
    if (swiper.params.loop && !isVirtual) {
      swiper.slideToLoop(swiper.realIndex, 0, false, true);
    } else {
      swiper.slideTo(swiper.activeIndex, 0, false, true);
    }
  }
  if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
    clearTimeout(swiper.autoplay.resizeTimeout);
    swiper.autoplay.resizeTimeout = setTimeout(() => {
      if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
        swiper.autoplay.resume();
      }
    }, 500);
  }
  // Return locks after resize
  swiper.allowSlidePrev = allowSlidePrev;
  swiper.allowSlideNext = allowSlideNext;
  if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
    swiper.checkOverflow();
  }
}

function onClick(e) {
  const swiper = this;
  if (!swiper.enabled) return;
  if (!swiper.allowClick) {
    if (swiper.params.preventClicks) e.preventDefault();
    if (swiper.params.preventClicksPropagation && swiper.animating) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
}

function onScroll() {
  const swiper = this;
  const {
    wrapperEl,
    rtlTranslate,
    enabled
  } = swiper;
  if (!enabled) return;
  swiper.previousTranslate = swiper.translate;
  if (swiper.isHorizontal()) {
    swiper.translate = -wrapperEl.scrollLeft;
  } else {
    swiper.translate = -wrapperEl.scrollTop;
  }
  // eslint-disable-next-line
  if (swiper.translate === 0) swiper.translate = 0;
  swiper.updateActiveIndex();
  swiper.updateSlidesClasses();
  let newProgress;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  if (translatesDiff === 0) {
    newProgress = 0;
  } else {
    newProgress = (swiper.translate - swiper.minTranslate()) / translatesDiff;
  }
  if (newProgress !== swiper.progress) {
    swiper.updateProgress(rtlTranslate ? -swiper.translate : swiper.translate);
  }
  swiper.emit('setTranslate', swiper.translate, false);
}

function onLoad(e) {
  const swiper = this;
  processLazyPreloader(swiper, e.target);
  if (swiper.params.cssMode || swiper.params.slidesPerView !== 'auto' && !swiper.params.autoHeight) {
    return;
  }
  swiper.update();
}

function onDocumentTouchStart() {
  const swiper = this;
  if (swiper.documentTouchHandlerProceeded) return;
  swiper.documentTouchHandlerProceeded = true;
  if (swiper.params.touchReleaseOnEdges) {
    swiper.el.style.touchAction = 'auto';
  }
}

const events = (swiper, method) => {
  const document = getDocument();
  const {
    params,
    el,
    wrapperEl,
    device
  } = swiper;
  const capture = !!params.nested;
  const domMethod = method === 'on' ? 'addEventListener' : 'removeEventListener';
  const swiperMethod = method;
  if (!el || typeof el === 'string') return;

  // Touch Events
  document[domMethod]('touchstart', swiper.onDocumentTouchStart, {
    passive: false,
    capture
  });
  el[domMethod]('touchstart', swiper.onTouchStart, {
    passive: false
  });
  el[domMethod]('pointerdown', swiper.onTouchStart, {
    passive: false
  });
  document[domMethod]('touchmove', swiper.onTouchMove, {
    passive: false,
    capture
  });
  document[domMethod]('pointermove', swiper.onTouchMove, {
    passive: false,
    capture
  });
  document[domMethod]('touchend', swiper.onTouchEnd, {
    passive: true
  });
  document[domMethod]('pointerup', swiper.onTouchEnd, {
    passive: true
  });
  document[domMethod]('pointercancel', swiper.onTouchEnd, {
    passive: true
  });
  document[domMethod]('touchcancel', swiper.onTouchEnd, {
    passive: true
  });
  document[domMethod]('pointerout', swiper.onTouchEnd, {
    passive: true
  });
  document[domMethod]('pointerleave', swiper.onTouchEnd, {
    passive: true
  });
  document[domMethod]('contextmenu', swiper.onTouchEnd, {
    passive: true
  });

  // Prevent Links Clicks
  if (params.preventClicks || params.preventClicksPropagation) {
    el[domMethod]('click', swiper.onClick, true);
  }
  if (params.cssMode) {
    wrapperEl[domMethod]('scroll', swiper.onScroll);
  }

  // Resize handler
  if (params.updateOnWindowResize) {
    swiper[swiperMethod](device.ios || device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate', onResize, true);
  } else {
    swiper[swiperMethod]('observerUpdate', onResize, true);
  }

  // Images loader
  el[domMethod]('load', swiper.onLoad, {
    capture: true
  });
};
function attachEvents() {
  const swiper = this;
  const {
    params
  } = swiper;
  swiper.onTouchStart = onTouchStart.bind(swiper);
  swiper.onTouchMove = onTouchMove.bind(swiper);
  swiper.onTouchEnd = onTouchEnd.bind(swiper);
  swiper.onDocumentTouchStart = onDocumentTouchStart.bind(swiper);
  if (params.cssMode) {
    swiper.onScroll = onScroll.bind(swiper);
  }
  swiper.onClick = onClick.bind(swiper);
  swiper.onLoad = onLoad.bind(swiper);
  events(swiper, 'on');
}
function detachEvents() {
  const swiper = this;
  events(swiper, 'off');
}
var events$1 = {
  attachEvents,
  detachEvents
};

const isGridEnabled = (swiper, params) => {
  return swiper.grid && params.grid && params.grid.rows > 1;
};
function setBreakpoint() {
  const swiper = this;
  const {
    realIndex,
    initialized,
    params,
    el
  } = swiper;
  const breakpoints = params.breakpoints;
  if (!breakpoints || breakpoints && Object.keys(breakpoints).length === 0) return;
  const document = getDocument();

  // Get breakpoint for window/container width and update parameters
  const breakpointsBase = params.breakpointsBase === 'window' || !params.breakpointsBase ? params.breakpointsBase : 'container';
  const breakpointContainer = ['window', 'container'].includes(params.breakpointsBase) || !params.breakpointsBase ? swiper.el : document.querySelector(params.breakpointsBase);
  const breakpoint = swiper.getBreakpoint(breakpoints, breakpointsBase, breakpointContainer);
  if (!breakpoint || swiper.currentBreakpoint === breakpoint) return;
  const breakpointOnlyParams = breakpoint in breakpoints ? breakpoints[breakpoint] : undefined;
  const breakpointParams = breakpointOnlyParams || swiper.originalParams;
  const wasMultiRow = isGridEnabled(swiper, params);
  const isMultiRow = isGridEnabled(swiper, breakpointParams);
  const wasGrabCursor = swiper.params.grabCursor;
  const isGrabCursor = breakpointParams.grabCursor;
  const wasEnabled = params.enabled;
  if (wasMultiRow && !isMultiRow) {
    el.classList.remove(`${params.containerModifierClass}grid`, `${params.containerModifierClass}grid-column`);
    swiper.emitContainerClasses();
  } else if (!wasMultiRow && isMultiRow) {
    el.classList.add(`${params.containerModifierClass}grid`);
    if (breakpointParams.grid.fill && breakpointParams.grid.fill === 'column' || !breakpointParams.grid.fill && params.grid.fill === 'column') {
      el.classList.add(`${params.containerModifierClass}grid-column`);
    }
    swiper.emitContainerClasses();
  }
  if (wasGrabCursor && !isGrabCursor) {
    swiper.unsetGrabCursor();
  } else if (!wasGrabCursor && isGrabCursor) {
    swiper.setGrabCursor();
  }

  // Toggle navigation, pagination, scrollbar
  ['navigation', 'pagination', 'scrollbar'].forEach(prop => {
    if (typeof breakpointParams[prop] === 'undefined') return;
    const wasModuleEnabled = params[prop] && params[prop].enabled;
    const isModuleEnabled = breakpointParams[prop] && breakpointParams[prop].enabled;
    if (wasModuleEnabled && !isModuleEnabled) {
      swiper[prop].disable();
    }
    if (!wasModuleEnabled && isModuleEnabled) {
      swiper[prop].enable();
    }
  });
  const directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
  const needsReLoop = params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);
  const wasLoop = params.loop;
  if (directionChanged && initialized) {
    swiper.changeDirection();
  }
  extend(swiper.params, breakpointParams);
  const isEnabled = swiper.params.enabled;
  const hasLoop = swiper.params.loop;
  Object.assign(swiper, {
    allowTouchMove: swiper.params.allowTouchMove,
    allowSlideNext: swiper.params.allowSlideNext,
    allowSlidePrev: swiper.params.allowSlidePrev
  });
  if (wasEnabled && !isEnabled) {
    swiper.disable();
  } else if (!wasEnabled && isEnabled) {
    swiper.enable();
  }
  swiper.currentBreakpoint = breakpoint;
  swiper.emit('_beforeBreakpoint', breakpointParams);
  if (initialized) {
    if (needsReLoop) {
      swiper.loopDestroy();
      swiper.loopCreate(realIndex);
      swiper.updateSlides();
    } else if (!wasLoop && hasLoop) {
      swiper.loopCreate(realIndex);
      swiper.updateSlides();
    } else if (wasLoop && !hasLoop) {
      swiper.loopDestroy();
    }
  }
  swiper.emit('breakpoint', breakpointParams);
}

function getBreakpoint(breakpoints, base = 'window', containerEl) {
  if (!breakpoints || base === 'container' && !containerEl) return undefined;
  let breakpoint = false;
  const window = getWindow();
  const currentHeight = base === 'window' ? window.innerHeight : containerEl.clientHeight;
  const points = Object.keys(breakpoints).map(point => {
    if (typeof point === 'string' && point.indexOf('@') === 0) {
      const minRatio = parseFloat(point.substr(1));
      const value = currentHeight * minRatio;
      return {
        value,
        point
      };
    }
    return {
      value: point,
      point
    };
  });
  points.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
  for (let i = 0; i < points.length; i += 1) {
    const {
      point,
      value
    } = points[i];
    if (base === 'window') {
      if (window.matchMedia(`(min-width: ${value}px)`).matches) {
        breakpoint = point;
      }
    } else if (value <= containerEl.clientWidth) {
      breakpoint = point;
    }
  }
  return breakpoint || 'max';
}

var breakpoints = {
  setBreakpoint,
  getBreakpoint
};

function prepareClasses(entries, prefix) {
  const resultClasses = [];
  entries.forEach(item => {
    if (typeof item === 'object') {
      Object.keys(item).forEach(classNames => {
        if (item[classNames]) {
          resultClasses.push(prefix + classNames);
        }
      });
    } else if (typeof item === 'string') {
      resultClasses.push(prefix + item);
    }
  });
  return resultClasses;
}
function addClasses() {
  const swiper = this;
  const {
    classNames,
    params,
    rtl,
    el,
    device
  } = swiper;
  // prettier-ignore
  const suffixes = prepareClasses(['initialized', params.direction, {
    'free-mode': swiper.params.freeMode && params.freeMode.enabled
  }, {
    'autoheight': params.autoHeight
  }, {
    'rtl': rtl
  }, {
    'grid': params.grid && params.grid.rows > 1
  }, {
    'grid-column': params.grid && params.grid.rows > 1 && params.grid.fill === 'column'
  }, {
    'android': device.android
  }, {
    'ios': device.ios
  }, {
    'css-mode': params.cssMode
  }, {
    'centered': params.cssMode && params.centeredSlides
  }, {
    'watch-progress': params.watchSlidesProgress
  }], params.containerModifierClass);
  classNames.push(...suffixes);
  el.classList.add(...classNames);
  swiper.emitContainerClasses();
}

function removeClasses() {
  const swiper = this;
  const {
    el,
    classNames
  } = swiper;
  if (!el || typeof el === 'string') return;
  el.classList.remove(...classNames);
  swiper.emitContainerClasses();
}

var classes = {
  addClasses,
  removeClasses
};

function checkOverflow() {
  const swiper = this;
  const {
    isLocked: wasLocked,
    params
  } = swiper;
  const {
    slidesOffsetBefore
  } = params;
  if (slidesOffsetBefore) {
    const lastSlideIndex = swiper.slides.length - 1;
    const lastSlideRightEdge = swiper.slidesGrid[lastSlideIndex] + swiper.slidesSizesGrid[lastSlideIndex] + slidesOffsetBefore * 2;
    swiper.isLocked = swiper.size > lastSlideRightEdge;
  } else {
    swiper.isLocked = swiper.snapGrid.length === 1;
  }
  if (params.allowSlideNext === true) {
    swiper.allowSlideNext = !swiper.isLocked;
  }
  if (params.allowSlidePrev === true) {
    swiper.allowSlidePrev = !swiper.isLocked;
  }
  if (wasLocked && wasLocked !== swiper.isLocked) {
    swiper.isEnd = false;
  }
  if (wasLocked !== swiper.isLocked) {
    swiper.emit(swiper.isLocked ? 'lock' : 'unlock');
  }
}
var checkOverflow$1 = {
  checkOverflow
};

var defaults = {
  init: true,
  direction: 'horizontal',
  oneWayMovement: false,
  swiperElementNodeName: 'SWIPER-CONTAINER',
  touchEventsTarget: 'wrapper',
  initialSlide: 0,
  speed: 300,
  cssMode: false,
  updateOnWindowResize: true,
  resizeObserver: true,
  nested: false,
  createElements: false,
  eventsPrefix: 'swiper',
  enabled: true,
  focusableElements: 'input, select, option, textarea, button, video, label',
  // Overrides
  width: null,
  height: null,
  //
  preventInteractionOnTransition: false,
  // ssr
  userAgent: null,
  url: null,
  // To support iOS's swipe-to-go-back gesture (when being used in-app).
  edgeSwipeDetection: false,
  edgeSwipeThreshold: 20,
  // Autoheight
  autoHeight: false,
  // Set wrapper width
  setWrapperSize: false,
  // Virtual Translate
  virtualTranslate: false,
  // Effects
  effect: 'slide',
  // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'

  // Breakpoints
  breakpoints: undefined,
  breakpointsBase: 'window',
  // Slides grid
  spaceBetween: 0,
  slidesPerView: 1,
  slidesPerGroup: 1,
  slidesPerGroupSkip: 0,
  slidesPerGroupAuto: false,
  centeredSlides: false,
  centeredSlidesBounds: false,
  slidesOffsetBefore: 0,
  // in px
  slidesOffsetAfter: 0,
  // in px
  normalizeSlideIndex: true,
  centerInsufficientSlides: false,
  snapToSlideEdge: false,
  // Disable swiper and hide navigation when container not overflow
  watchOverflow: true,
  // Round length
  roundLengths: false,
  // Touches
  touchRatio: 1,
  touchAngle: 45,
  simulateTouch: true,
  shortSwipes: true,
  longSwipes: true,
  longSwipesRatio: 0.5,
  longSwipesMs: 300,
  followFinger: true,
  allowTouchMove: true,
  threshold: 5,
  touchMoveStopPropagation: false,
  touchStartPreventDefault: true,
  touchStartForcePreventDefault: false,
  touchReleaseOnEdges: false,
  // Unique Navigation Elements
  uniqueNavElements: true,
  // Resistance
  resistance: true,
  resistanceRatio: 0.85,
  // Progress
  watchSlidesProgress: false,
  // Cursor
  grabCursor: false,
  // Clicks
  preventClicks: true,
  preventClicksPropagation: true,
  slideToClickedSlide: false,
  // loop
  loop: false,
  loopAddBlankSlides: true,
  loopAdditionalSlides: 0,
  loopPreventsSliding: true,
  // rewind
  rewind: false,
  // Swiping/no swiping
  allowSlidePrev: true,
  allowSlideNext: true,
  swipeHandler: null,
  // '.swipe-handler',
  noSwiping: true,
  noSwipingClass: 'swiper-no-swiping',
  noSwipingSelector: null,
  // Passive Listeners
  passiveListeners: true,
  maxBackfaceHiddenSlides: 10,
  // NS
  containerModifierClass: 'swiper-',
  // NEW
  slideClass: 'swiper-slide',
  slideBlankClass: 'swiper-slide-blank',
  slideActiveClass: 'swiper-slide-active',
  slideVisibleClass: 'swiper-slide-visible',
  slideFullyVisibleClass: 'swiper-slide-fully-visible',
  slideNextClass: 'swiper-slide-next',
  slidePrevClass: 'swiper-slide-prev',
  wrapperClass: 'swiper-wrapper',
  lazyPreloaderClass: 'swiper-lazy-preloader',
  lazyPreloadPrevNext: 0,
  // Callbacks
  runCallbacksOnInit: true,
  // Internals
  _emitClasses: false
};

function moduleExtendParams(params, allModulesParams) {
  return function extendParams(obj = {}) {
    const moduleParamName = Object.keys(obj)[0];
    const moduleParams = obj[moduleParamName];
    if (typeof moduleParams !== 'object' || moduleParams === null) {
      extend(allModulesParams, obj);
      return;
    }
    if (params[moduleParamName] === true) {
      params[moduleParamName] = {
        enabled: true
      };
    }
    if (moduleParamName === 'navigation' && params[moduleParamName] && params[moduleParamName].enabled && !params[moduleParamName].prevEl && !params[moduleParamName].nextEl) {
      params[moduleParamName].auto = true;
    }
    if (['pagination', 'scrollbar'].indexOf(moduleParamName) >= 0 && params[moduleParamName] && params[moduleParamName].enabled && !params[moduleParamName].el) {
      params[moduleParamName].auto = true;
    }
    if (!(moduleParamName in params && 'enabled' in moduleParams)) {
      extend(allModulesParams, obj);
      return;
    }
    if (typeof params[moduleParamName] === 'object' && !('enabled' in params[moduleParamName])) {
      params[moduleParamName].enabled = true;
    }
    if (!params[moduleParamName]) params[moduleParamName] = {
      enabled: false
    };
    extend(allModulesParams, obj);
  };
}

/* eslint no-param-reassign: "off" */
const prototypes = {
  eventsEmitter,
  update,
  translate,
  transition,
  slide,
  loop,
  grabCursor,
  events: events$1,
  breakpoints,
  checkOverflow: checkOverflow$1,
  classes
};
const extendedDefaults = {};
class Swiper {
  constructor(...args) {
    let el;
    let params;
    if (args.length === 1 && args[0].constructor && Object.prototype.toString.call(args[0]).slice(8, -1) === 'Object') {
      params = args[0];
    } else {
      [el, params] = args;
    }
    if (!params) params = {};
    params = extend({}, params);
    if (el && !params.el) params.el = el;
    const document = getDocument();
    if (params.el && typeof params.el === 'string' && document.querySelectorAll(params.el).length > 1) {
      const swipers = [];
      document.querySelectorAll(params.el).forEach(containerEl => {
        const newParams = extend({}, params, {
          el: containerEl
        });
        swipers.push(new Swiper(newParams));
      });
      // eslint-disable-next-line no-constructor-return
      return swipers;
    }

    // Swiper Instance
    const swiper = this;
    swiper.__swiper__ = true;
    swiper.support = getSupport();
    swiper.device = getDevice({
      userAgent: params.userAgent
    });
    swiper.browser = getBrowser();
    swiper.eventsListeners = {};
    swiper.eventsAnyListeners = [];
    swiper.modules = [...swiper.__modules__];
    if (params.modules && Array.isArray(params.modules)) {
      params.modules.forEach(mod => {
        if (typeof mod === 'function' && swiper.modules.indexOf(mod) < 0) {
          swiper.modules.push(mod);
        }
      });
    }
    const allModulesParams = {};
    swiper.modules.forEach(mod => {
      mod({
        params,
        swiper,
        extendParams: moduleExtendParams(params, allModulesParams),
        on: swiper.on.bind(swiper),
        once: swiper.once.bind(swiper),
        off: swiper.off.bind(swiper),
        emit: swiper.emit.bind(swiper)
      });
    });

    // Extend defaults with modules params
    const swiperParams = extend({}, defaults, allModulesParams);

    // Extend defaults with passed params
    swiper.params = extend({}, swiperParams, extendedDefaults, params);
    swiper.originalParams = extend({}, swiper.params);
    swiper.passedParams = extend({}, params);

    // add event listeners
    if (swiper.params && swiper.params.on) {
      Object.keys(swiper.params.on).forEach(eventName => {
        swiper.on(eventName, swiper.params.on[eventName]);
      });
    }
    if (swiper.params && swiper.params.onAny) {
      swiper.onAny(swiper.params.onAny);
    }

    // Extend Swiper
    Object.assign(swiper, {
      enabled: swiper.params.enabled,
      el,
      // Classes
      classNames: [],
      // Slides
      slides: [],
      slidesGrid: [],
      snapGrid: [],
      slidesSizesGrid: [],
      // isDirection
      isHorizontal() {
        return swiper.params.direction === 'horizontal';
      },
      isVertical() {
        return swiper.params.direction === 'vertical';
      },
      // Indexes
      activeIndex: 0,
      realIndex: 0,
      //
      isBeginning: true,
      isEnd: false,
      // Props
      translate: 0,
      previousTranslate: 0,
      progress: 0,
      velocity: 0,
      animating: false,
      cssOverflowAdjustment() {
        // Returns 0 unless `translate` is > 2**23
        // Should be subtracted from css values to prevent overflow
        return Math.trunc(this.translate / 2 ** 23) * 2 ** 23;
      },
      // Locks
      allowSlideNext: swiper.params.allowSlideNext,
      allowSlidePrev: swiper.params.allowSlidePrev,
      // Touch Events
      touchEventsData: {
        isTouched: undefined,
        isMoved: undefined,
        allowTouchCallbacks: undefined,
        touchStartTime: undefined,
        isScrolling: undefined,
        currentTranslate: undefined,
        startTranslate: undefined,
        allowThresholdMove: undefined,
        // Form elements to match
        focusableElements: swiper.params.focusableElements,
        // Last click time
        lastClickTime: 0,
        clickTimeout: undefined,
        // Velocities
        velocities: [],
        allowMomentumBounce: undefined,
        startMoving: undefined,
        pointerId: null,
        touchId: null
      },
      // Clicks
      allowClick: true,
      // Touches
      allowTouchMove: swiper.params.allowTouchMove,
      touches: {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        diff: 0
      },
      // Images
      imagesToLoad: [],
      imagesLoaded: 0
    });
    swiper.emit('_swiper');

    // Init
    if (swiper.params.init) {
      swiper.init();
    }

    // Return app instance
    // eslint-disable-next-line no-constructor-return
    return swiper;
  }
  getDirectionLabel(property) {
    if (this.isHorizontal()) {
      return property;
    }
    // prettier-ignore
    return {
      'width': 'height',
      'margin-top': 'margin-left',
      'margin-bottom ': 'margin-right',
      'margin-left': 'margin-top',
      'margin-right': 'margin-bottom',
      'padding-left': 'padding-top',
      'padding-right': 'padding-bottom',
      'marginRight': 'marginBottom'
    }[property];
  }
  getSlideIndex(slideEl) {
    const {
      slidesEl,
      params
    } = this;
    const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
    const firstSlideIndex = elementIndex(slides[0]);
    return elementIndex(slideEl) - firstSlideIndex;
  }
  getSlideIndexByData(index) {
    return this.getSlideIndex(this.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') * 1 === index));
  }
  getSlideIndexWhenGrid(index) {
    if (this.grid && this.params.grid && this.params.grid.rows > 1) {
      if (this.params.grid.fill === 'column') {
        index = Math.floor(index / this.params.grid.rows);
      } else if (this.params.grid.fill === 'row') {
        index = index % Math.ceil(this.slides.length / this.params.grid.rows);
      }
    }
    return index;
  }
  recalcSlides() {
    const swiper = this;
    const {
      slidesEl,
      params
    } = swiper;
    swiper.slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
  }
  enable() {
    const swiper = this;
    if (swiper.enabled) return;
    swiper.enabled = true;
    if (swiper.params.grabCursor) {
      swiper.setGrabCursor();
    }
    swiper.emit('enable');
  }
  disable() {
    const swiper = this;
    if (!swiper.enabled) return;
    swiper.enabled = false;
    if (swiper.params.grabCursor) {
      swiper.unsetGrabCursor();
    }
    swiper.emit('disable');
  }
  setProgress(progress, speed) {
    const swiper = this;
    progress = Math.min(Math.max(progress, 0), 1);
    const min = swiper.minTranslate();
    const max = swiper.maxTranslate();
    const current = (max - min) * progress + min;
    swiper.translateTo(current, typeof speed === 'undefined' ? 0 : speed);
    swiper.updateActiveIndex();
    swiper.updateSlidesClasses();
  }
  emitContainerClasses() {
    const swiper = this;
    if (!swiper.params._emitClasses || !swiper.el) return;
    const cls = swiper.el.className.split(' ').filter(className => {
      return className.indexOf('swiper') === 0 || className.indexOf(swiper.params.containerModifierClass) === 0;
    });
    swiper.emit('_containerClasses', cls.join(' '));
  }
  getSlideClasses(slideEl) {
    const swiper = this;
    if (swiper.destroyed) return '';
    return slideEl.className.split(' ').filter(className => {
      return className.indexOf('swiper-slide') === 0 || className.indexOf(swiper.params.slideClass) === 0;
    }).join(' ');
  }
  emitSlidesClasses() {
    const swiper = this;
    if (!swiper.params._emitClasses || !swiper.el) return;
    const updates = [];
    swiper.slides.forEach(slideEl => {
      const classNames = swiper.getSlideClasses(slideEl);
      updates.push({
        slideEl,
        classNames
      });
      swiper.emit('_slideClass', slideEl, classNames);
    });
    swiper.emit('_slideClasses', updates);
  }
  slidesPerViewDynamic(view = 'current', exact = false) {
    const swiper = this;
    const {
      params,
      slides,
      slidesGrid,
      slidesSizesGrid,
      size: swiperSize,
      activeIndex
    } = swiper;
    let spv = 1;
    if (typeof params.slidesPerView === 'number') return params.slidesPerView;
    if (params.centeredSlides) {
      let slideSize = slides[activeIndex] ? Math.ceil(slides[activeIndex].swiperSlideSize) : 0;
      let breakLoop;
      for (let i = activeIndex + 1; i < slides.length; i += 1) {
        if (slides[i] && !breakLoop) {
          slideSize += Math.ceil(slides[i].swiperSlideSize);
          spv += 1;
          if (slideSize > swiperSize) breakLoop = true;
        }
      }
      for (let i = activeIndex - 1; i >= 0; i -= 1) {
        if (slides[i] && !breakLoop) {
          slideSize += slides[i].swiperSlideSize;
          spv += 1;
          if (slideSize > swiperSize) breakLoop = true;
        }
      }
    } else {
      // eslint-disable-next-line
      if (view === 'current') {
        for (let i = activeIndex + 1; i < slides.length; i += 1) {
          const slideInView = exact ? slidesGrid[i] + slidesSizesGrid[i] - slidesGrid[activeIndex] < swiperSize : slidesGrid[i] - slidesGrid[activeIndex] < swiperSize;
          if (slideInView) {
            spv += 1;
          }
        }
      } else {
        // previous
        for (let i = activeIndex - 1; i >= 0; i -= 1) {
          const slideInView = slidesGrid[activeIndex] - slidesGrid[i] < swiperSize;
          if (slideInView) {
            spv += 1;
          }
        }
      }
    }
    return spv;
  }
  update() {
    const swiper = this;
    if (!swiper || swiper.destroyed) return;
    const {
      snapGrid,
      params
    } = swiper;
    // Breakpoints
    if (params.breakpoints) {
      swiper.setBreakpoint();
    }
    [...swiper.el.querySelectorAll('[loading="lazy"]')].forEach(imageEl => {
      if (imageEl.complete) {
        processLazyPreloader(swiper, imageEl);
      }
    });
    swiper.updateSize();
    swiper.updateSlides();
    swiper.updateProgress();
    swiper.updateSlidesClasses();
    function setTranslate() {
      const translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
      const newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
      swiper.setTranslate(newTranslate);
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    }
    let translated;
    if (params.freeMode && params.freeMode.enabled && !params.cssMode) {
      setTranslate();
      if (params.autoHeight) {
        swiper.updateAutoHeight();
      }
    } else {
      if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !params.centeredSlides) {
        const slides = swiper.virtual && params.virtual.enabled ? swiper.virtual.slides : swiper.slides;
        translated = swiper.slideTo(slides.length - 1, 0, false, true);
      } else {
        translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
      }
      if (!translated) {
        setTranslate();
      }
    }
    if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
      swiper.checkOverflow();
    }
    swiper.emit('update');
  }
  changeDirection(newDirection, needUpdate = true) {
    const swiper = this;
    const currentDirection = swiper.params.direction;
    if (!newDirection) {
      // eslint-disable-next-line
      newDirection = currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
    }
    if (newDirection === currentDirection || newDirection !== 'horizontal' && newDirection !== 'vertical') {
      return swiper;
    }
    swiper.el.classList.remove(`${swiper.params.containerModifierClass}${currentDirection}`);
    swiper.el.classList.add(`${swiper.params.containerModifierClass}${newDirection}`);
    swiper.emitContainerClasses();
    swiper.params.direction = newDirection;
    swiper.slides.forEach(slideEl => {
      if (newDirection === 'vertical') {
        slideEl.style.width = '';
      } else {
        slideEl.style.height = '';
      }
    });
    swiper.emit('changeDirection');
    if (needUpdate) swiper.update();
    return swiper;
  }
  changeLanguageDirection(direction) {
    const swiper = this;
    if (swiper.rtl && direction === 'rtl' || !swiper.rtl && direction === 'ltr') return;
    swiper.rtl = direction === 'rtl';
    swiper.rtlTranslate = swiper.params.direction === 'horizontal' && swiper.rtl;
    if (swiper.rtl) {
      swiper.el.classList.add(`${swiper.params.containerModifierClass}rtl`);
      swiper.el.dir = 'rtl';
    } else {
      swiper.el.classList.remove(`${swiper.params.containerModifierClass}rtl`);
      swiper.el.dir = 'ltr';
    }
    swiper.update();
  }
  mount(element) {
    const swiper = this;
    if (swiper.mounted) return true;

    // Find el
    let el = element || swiper.params.el;
    if (typeof el === 'string') {
      el = document.querySelector(el);
    }
    if (!el) {
      return false;
    }
    el.swiper = swiper;
    if (el.parentNode && el.parentNode.host && el.parentNode.host.nodeName === swiper.params.swiperElementNodeName.toUpperCase()) {
      swiper.isElement = true;
    }
    const getWrapperSelector = () => {
      return `.${(swiper.params.wrapperClass || '').trim().split(' ').join('.')}`;
    };
    const getWrapper = () => {
      if (el && el.shadowRoot && el.shadowRoot.querySelector) {
        const res = el.shadowRoot.querySelector(getWrapperSelector());
        // Children needs to return slot items
        return res;
      }
      return elementChildren(el, getWrapperSelector())[0];
    };
    // Find Wrapper
    let wrapperEl = getWrapper();
    if (!wrapperEl && swiper.params.createElements) {
      wrapperEl = createElement('div', swiper.params.wrapperClass);
      el.append(wrapperEl);
      elementChildren(el, `.${swiper.params.slideClass}`).forEach(slideEl => {
        wrapperEl.append(slideEl);
      });
    }
    Object.assign(swiper, {
      el,
      wrapperEl,
      slidesEl: swiper.isElement && !el.parentNode.host.slideSlots ? el.parentNode.host : wrapperEl,
      hostEl: swiper.isElement ? el.parentNode.host : el,
      mounted: true,
      // RTL
      rtl: el.dir.toLowerCase() === 'rtl' || elementStyle(el, 'direction') === 'rtl',
      rtlTranslate: swiper.params.direction === 'horizontal' && (el.dir.toLowerCase() === 'rtl' || elementStyle(el, 'direction') === 'rtl'),
      wrongRTL: elementStyle(wrapperEl, 'display') === '-webkit-box'
    });
    return true;
  }
  init(el) {
    const swiper = this;
    if (swiper.initialized) return swiper;
    const mounted = swiper.mount(el);
    if (mounted === false) return swiper;
    swiper.emit('beforeInit');

    // Set breakpoint
    if (swiper.params.breakpoints) {
      swiper.setBreakpoint();
    }

    // Add Classes
    swiper.addClasses();

    // Update size
    swiper.updateSize();

    // Update slides
    swiper.updateSlides();
    if (swiper.params.watchOverflow) {
      swiper.checkOverflow();
    }

    // Set Grab Cursor
    if (swiper.params.grabCursor && swiper.enabled) {
      swiper.setGrabCursor();
    }

    // Slide To Initial Slide
    if (swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
      swiper.slideTo(swiper.params.initialSlide + swiper.virtual.slidesBefore, 0, swiper.params.runCallbacksOnInit, false, true);
    } else {
      swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit, false, true);
    }

    // Create loop
    if (swiper.params.loop) {
      swiper.loopCreate(undefined, true);
    }

    // Attach events
    swiper.attachEvents();
    const lazyElements = [...swiper.el.querySelectorAll('[loading="lazy"]')];
    if (swiper.isElement) {
      lazyElements.push(...swiper.hostEl.querySelectorAll('[loading="lazy"]'));
    }
    lazyElements.forEach(imageEl => {
      if (imageEl.complete) {
        processLazyPreloader(swiper, imageEl);
      } else {
        imageEl.addEventListener('load', e => {
          processLazyPreloader(swiper, e.target);
        });
      }
    });
    preload(swiper);

    // Init Flag
    swiper.initialized = true;
    preload(swiper);

    // Emit
    swiper.emit('init');
    swiper.emit('afterInit');
    return swiper;
  }
  destroy(deleteInstance = true, cleanStyles = true) {
    const swiper = this;
    const {
      params,
      el,
      wrapperEl,
      slides
    } = swiper;
    if (typeof swiper.params === 'undefined' || swiper.destroyed) {
      return null;
    }
    swiper.emit('beforeDestroy');

    // Init Flag
    swiper.initialized = false;

    // Detach events
    swiper.detachEvents();

    // Destroy loop
    if (params.loop) {
      swiper.loopDestroy();
    }

    // Cleanup styles
    if (cleanStyles) {
      swiper.removeClasses();
      if (el && typeof el !== 'string') {
        el.removeAttribute('style');
      }
      if (wrapperEl) {
        wrapperEl.removeAttribute('style');
      }
      if (slides && slides.length) {
        slides.forEach(slideEl => {
          slideEl.classList.remove(params.slideVisibleClass, params.slideFullyVisibleClass, params.slideActiveClass, params.slideNextClass, params.slidePrevClass);
          slideEl.removeAttribute('style');
          slideEl.removeAttribute('data-swiper-slide-index');
        });
      }
    }
    swiper.emit('destroy');

    // Detach emitter events
    Object.keys(swiper.eventsListeners).forEach(eventName => {
      swiper.off(eventName);
    });
    if (deleteInstance !== false) {
      if (swiper.el && typeof swiper.el !== 'string') {
        swiper.el.swiper = null;
      }
      deleteProps(swiper);
    }
    swiper.destroyed = true;
    return null;
  }
  static extendDefaults(newDefaults) {
    extend(extendedDefaults, newDefaults);
  }
  static get extendedDefaults() {
    return extendedDefaults;
  }
  static get defaults() {
    return defaults;
  }
  static installModule(mod) {
    if (!Swiper.prototype.__modules__) Swiper.prototype.__modules__ = [];
    const modules = Swiper.prototype.__modules__;
    if (typeof mod === 'function' && modules.indexOf(mod) < 0) {
      modules.push(mod);
    }
  }
  static use(module) {
    if (Array.isArray(module)) {
      module.forEach(m => Swiper.installModule(m));
      return Swiper;
    }
    Swiper.installModule(module);
    return Swiper;
  }
}
Object.keys(prototypes).forEach(prototypeGroup => {
  Object.keys(prototypes[prototypeGroup]).forEach(protoMethod => {
    Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
  });
});
Swiper.use([Resize, Observer]);

/* eslint-disable consistent-return */
function Keyboard({
  swiper,
  extendParams,
  on,
  emit
}) {
  const document = getDocument();
  const window = getWindow();
  swiper.keyboard = {
    enabled: false
  };
  extendParams({
    keyboard: {
      enabled: false,
      onlyInViewport: true,
      pageUpDown: true,
      speed: undefined
    }
  });
  function handle(event) {
    if (!swiper.enabled) return;
    const {
      rtlTranslate: rtl
    } = swiper;
    let e = event;
    if (e.originalEvent) e = e.originalEvent; // jquery fix
    const kc = e.keyCode || e.charCode;
    const pageUpDown = swiper.params.keyboard.pageUpDown;
    const isPageUp = pageUpDown && kc === 33;
    const isPageDown = pageUpDown && kc === 34;
    const isArrowLeft = kc === 37;
    const isArrowRight = kc === 39;
    const isArrowUp = kc === 38;
    const isArrowDown = kc === 40;
    // Directions locks
    if (!swiper.allowSlideNext && (swiper.isHorizontal() && isArrowRight || swiper.isVertical() && isArrowDown || isPageDown)) {
      return false;
    }
    if (!swiper.allowSlidePrev && (swiper.isHorizontal() && isArrowLeft || swiper.isVertical() && isArrowUp || isPageUp)) {
      return false;
    }
    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
      return undefined;
    }
    if (document.activeElement && (document.activeElement.isContentEditable || document.activeElement.nodeName && (document.activeElement.nodeName.toLowerCase() === 'input' || document.activeElement.nodeName.toLowerCase() === 'textarea'))) {
      return undefined;
    }
    if (swiper.params.keyboard.onlyInViewport && (isPageUp || isPageDown || isArrowLeft || isArrowRight || isArrowUp || isArrowDown)) {
      let inView = false;
      // Check that swiper should be inside of visible area of window
      if (elementParents(swiper.el, `.${swiper.params.slideClass}, swiper-slide`).length > 0 && elementParents(swiper.el, `.${swiper.params.slideActiveClass}`).length === 0) {
        return undefined;
      }
      const el = swiper.el;
      const swiperWidth = el.clientWidth;
      const swiperHeight = el.clientHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const swiperOffset = elementOffset(el);
      if (rtl) swiperOffset.left -= el.scrollLeft;
      const swiperCoord = [[swiperOffset.left, swiperOffset.top], [swiperOffset.left + swiperWidth, swiperOffset.top], [swiperOffset.left, swiperOffset.top + swiperHeight], [swiperOffset.left + swiperWidth, swiperOffset.top + swiperHeight]];
      for (let i = 0; i < swiperCoord.length; i += 1) {
        const point = swiperCoord[i];
        if (point[0] >= 0 && point[0] <= windowWidth && point[1] >= 0 && point[1] <= windowHeight) {
          if (point[0] === 0 && point[1] === 0) continue; // eslint-disable-line
          inView = true;
        }
      }
      if (!inView) return undefined;
    }
    const speed = swiper.params.keyboard.speed;
    if (swiper.isHorizontal()) {
      if (isPageUp || isPageDown || isArrowLeft || isArrowRight) {
        if (e.preventDefault) e.preventDefault();else e.returnValue = false;
      }
      if ((isPageDown || isArrowRight) && !rtl || (isPageUp || isArrowLeft) && rtl) swiper.slideNext(speed);
      if ((isPageUp || isArrowLeft) && !rtl || (isPageDown || isArrowRight) && rtl) swiper.slidePrev(speed);
    } else {
      if (isPageUp || isPageDown || isArrowUp || isArrowDown) {
        if (e.preventDefault) e.preventDefault();else e.returnValue = false;
      }
      if (isPageDown || isArrowDown) swiper.slideNext(speed);
      if (isPageUp || isArrowUp) swiper.slidePrev(speed);
    }
    emit('keyPress', kc);
    return undefined;
  }
  function enable() {
    if (swiper.keyboard.enabled) return;
    document.addEventListener('keydown', handle);
    swiper.keyboard.enabled = true;
  }
  function disable() {
    if (!swiper.keyboard.enabled) return;
    document.removeEventListener('keydown', handle);
    swiper.keyboard.enabled = false;
  }
  on('init', () => {
    if (swiper.params.keyboard.enabled) {
      enable();
    }
  });
  on('destroy', () => {
    if (swiper.keyboard.enabled) {
      disable();
    }
  });
  Object.assign(swiper.keyboard, {
    enable,
    disable
  });
}

/* eslint-disable consistent-return */
function Mousewheel({
  swiper,
  extendParams,
  on,
  emit
}) {
  const window = getWindow();
  extendParams({
    mousewheel: {
      enabled: false,
      releaseOnEdges: false,
      invert: false,
      forceToAxis: false,
      sensitivity: 1,
      eventsTarget: 'container',
      thresholdDelta: null,
      thresholdTime: null,
      noMousewheelClass: 'swiper-no-mousewheel'
    }
  });
  swiper.mousewheel = {
    enabled: false
  };
  let timeout;
  let lastScrollTime = now();
  let lastEventBeforeSnap;
  const recentWheelEvents = [];
  function normalize(e) {
    // Reasonable defaults
    const PIXEL_STEP = 10;
    const LINE_HEIGHT = 40;
    const PAGE_HEIGHT = 800;
    let sX = 0;
    let sY = 0; // spinX, spinY
    let pX = 0;
    let pY = 0; // pixelX, pixelY

    // Legacy
    if ('detail' in e) {
      sY = e.detail;
    }
    if ('wheelDelta' in e) {
      sY = -e.wheelDelta / 120;
    }
    if ('wheelDeltaY' in e) {
      sY = -e.wheelDeltaY / 120;
    }
    if ('wheelDeltaX' in e) {
      sX = -e.wheelDeltaX / 120;
    }

    // side scrolling on FF with DOMMouseScroll
    if ('axis' in e && e.axis === e.HORIZONTAL_AXIS) {
      sX = sY;
      sY = 0;
    }
    pX = sX * PIXEL_STEP;
    pY = sY * PIXEL_STEP;
    if ('deltaY' in e) {
      pY = e.deltaY;
    }
    if ('deltaX' in e) {
      pX = e.deltaX;
    }
    if (e.shiftKey && !pX) {
      // if user scrolls with shift he wants horizontal scroll
      pX = pY;
      pY = 0;
    }
    if ((pX || pY) && e.deltaMode) {
      if (e.deltaMode === 1) {
        // delta in LINE units
        pX *= LINE_HEIGHT;
        pY *= LINE_HEIGHT;
      } else {
        // delta in PAGE units
        pX *= PAGE_HEIGHT;
        pY *= PAGE_HEIGHT;
      }
    }

    // Fall-back if spin cannot be determined
    if (pX && !sX) {
      sX = pX < 1 ? -1 : 1;
    }
    if (pY && !sY) {
      sY = pY < 1 ? -1 : 1;
    }
    return {
      spinX: sX,
      spinY: sY,
      pixelX: pX,
      pixelY: pY
    };
  }
  function handleMouseEnter() {
    if (!swiper.enabled) return;
    swiper.mouseEntered = true;
  }
  function handleMouseLeave() {
    if (!swiper.enabled) return;
    swiper.mouseEntered = false;
  }
  function animateSlider(newEvent) {
    if (swiper.params.mousewheel.thresholdDelta && newEvent.delta < swiper.params.mousewheel.thresholdDelta) {
      // Prevent if delta of wheel scroll delta is below configured threshold
      return false;
    }
    if (swiper.params.mousewheel.thresholdTime && now() - lastScrollTime < swiper.params.mousewheel.thresholdTime) {
      // Prevent if time between scrolls is below configured threshold
      return false;
    }

    // If the movement is NOT big enough and
    // if the last time the user scrolled was too close to the current one (avoid continuously triggering the slider):
    //   Don't go any further (avoid insignificant scroll movement).
    if (newEvent.delta >= 6 && now() - lastScrollTime < 60) {
      // Return false as a default
      return true;
    }
    // If user is scrolling towards the end:
    //   If the slider hasn't hit the latest slide or
    //   if the slider is a loop and
    //   if the slider isn't moving right now:
    //     Go to next slide and
    //     emit a scroll event.
    // Else (the user is scrolling towards the beginning) and
    // if the slider hasn't hit the first slide or
    // if the slider is a loop and
    // if the slider isn't moving right now:
    //   Go to prev slide and
    //   emit a scroll event.
    if (newEvent.direction < 0) {
      if ((!swiper.isEnd || swiper.params.loop) && !swiper.animating) {
        swiper.slideNext();
        emit('scroll', newEvent.raw);
      }
    } else if ((!swiper.isBeginning || swiper.params.loop) && !swiper.animating) {
      swiper.slidePrev();
      emit('scroll', newEvent.raw);
    }
    // If you got here is because an animation has been triggered so store the current time
    lastScrollTime = new window.Date().getTime();
    // Return false as a default
    return false;
  }
  function releaseScroll(newEvent) {
    const params = swiper.params.mousewheel;
    if (newEvent.direction < 0) {
      if (swiper.isEnd && !swiper.params.loop && params.releaseOnEdges) {
        // Return true to animate scroll on edges
        return true;
      }
    } else if (swiper.isBeginning && !swiper.params.loop && params.releaseOnEdges) {
      // Return true to animate scroll on edges
      return true;
    }
    return false;
  }
  function handle(event) {
    let e = event;
    let disableParentSwiper = true;
    if (!swiper.enabled) return;

    // Ignore event if the target or its parents have the swiper-no-mousewheel class
    if (event.target.closest(`.${swiper.params.mousewheel.noMousewheelClass}`)) return;
    const params = swiper.params.mousewheel;
    if (swiper.params.cssMode) {
      e.preventDefault();
    }
    let targetEl = swiper.el;
    if (swiper.params.mousewheel.eventsTarget !== 'container') {
      targetEl = document.querySelector(swiper.params.mousewheel.eventsTarget);
    }
    const targetElContainsTarget = targetEl && targetEl.contains(e.target);
    if (!swiper.mouseEntered && !targetElContainsTarget && !params.releaseOnEdges) return true;
    if (e.originalEvent) e = e.originalEvent; // jquery fix
    let delta = 0;
    const rtlFactor = swiper.rtlTranslate ? -1 : 1;
    const data = normalize(e);
    if (params.forceToAxis) {
      if (swiper.isHorizontal()) {
        if (Math.abs(data.pixelX) > Math.abs(data.pixelY)) delta = -data.pixelX * rtlFactor;else return true;
      } else if (Math.abs(data.pixelY) > Math.abs(data.pixelX)) delta = -data.pixelY;else return true;
    } else {
      delta = Math.abs(data.pixelX) > Math.abs(data.pixelY) ? -data.pixelX * rtlFactor : -data.pixelY;
    }
    if (delta === 0) return true;
    if (params.invert) delta = -delta;

    // Get the scroll positions
    let positions = swiper.getTranslate() + delta * params.sensitivity;
    if (positions >= swiper.minTranslate()) positions = swiper.minTranslate();
    if (positions <= swiper.maxTranslate()) positions = swiper.maxTranslate();

    // When loop is true:
    //     the disableParentSwiper will be true.
    // When loop is false:
    //     if the scroll positions is not on edge,
    //     then the disableParentSwiper will be true.
    //     if the scroll on edge positions,
    //     then the disableParentSwiper will be false.
    disableParentSwiper = swiper.params.loop ? true : !(positions === swiper.minTranslate() || positions === swiper.maxTranslate());
    if (disableParentSwiper && swiper.params.nested) e.stopPropagation();
    if (!swiper.params.freeMode || !swiper.params.freeMode.enabled) {
      // Register the new event in a variable which stores the relevant data
      const newEvent = {
        time: now(),
        delta: Math.abs(delta),
        direction: Math.sign(delta),
        raw: event
      };

      // Keep the most recent events
      if (recentWheelEvents.length >= 2) {
        recentWheelEvents.shift(); // only store the last N events
      }

      const prevEvent = recentWheelEvents.length ? recentWheelEvents[recentWheelEvents.length - 1] : undefined;
      recentWheelEvents.push(newEvent);

      // If there is at least one previous recorded event:
      //   If direction has changed or
      //   if the scroll is quicker than the previous one:
      //     Animate the slider.
      // Else (this is the first time the wheel is moved):
      //     Animate the slider.
      if (prevEvent) {
        if (newEvent.direction !== prevEvent.direction || newEvent.delta > prevEvent.delta || newEvent.time > prevEvent.time + 150) {
          animateSlider(newEvent);
        }
      } else {
        animateSlider(newEvent);
      }

      // If it's time to release the scroll:
      //   Return now so you don't hit the preventDefault.
      if (releaseScroll(newEvent)) {
        return true;
      }
    } else {
      // Freemode or scrollContainer:

      // If we recently snapped after a momentum scroll, then ignore wheel events
      // to give time for the deceleration to finish. Stop ignoring after 500 msecs
      // or if it's a new scroll (larger delta or inverse sign as last event before
      // an end-of-momentum snap).
      const newEvent = {
        time: now(),
        delta: Math.abs(delta),
        direction: Math.sign(delta)
      };
      const ignoreWheelEvents = lastEventBeforeSnap && newEvent.time < lastEventBeforeSnap.time + 500 && newEvent.delta <= lastEventBeforeSnap.delta && newEvent.direction === lastEventBeforeSnap.direction;
      if (!ignoreWheelEvents) {
        lastEventBeforeSnap = undefined;
        let position = swiper.getTranslate() + delta * params.sensitivity;
        const wasBeginning = swiper.isBeginning;
        const wasEnd = swiper.isEnd;
        if (position >= swiper.minTranslate()) position = swiper.minTranslate();
        if (position <= swiper.maxTranslate()) position = swiper.maxTranslate();
        swiper.setTransition(0);
        swiper.setTranslate(position);
        swiper.updateProgress();
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
        if (!wasBeginning && swiper.isBeginning || !wasEnd && swiper.isEnd) {
          swiper.updateSlidesClasses();
        }
        if (swiper.params.loop) {
          swiper.loopFix({
            direction: newEvent.direction < 0 ? 'next' : 'prev',
            byMousewheel: true
          });
        }
        if (swiper.params.freeMode.sticky) {
          // When wheel scrolling starts with sticky (aka snap) enabled, then detect
          // the end of a momentum scroll by storing recent (N=15?) wheel events.
          // 1. do all N events have decreasing or same (absolute value) delta?
          // 2. did all N events arrive in the last M (M=500?) msecs?
          // 3. does the earliest event have an (absolute value) delta that's
          //    at least P (P=1?) larger than the most recent event's delta?
          // 4. does the latest event have a delta that's smaller than Q (Q=6?) pixels?
          // If 1-4 are "yes" then we're near the end of a momentum scroll deceleration.
          // Snap immediately and ignore remaining wheel events in this scroll.
          // See comment above for "remaining wheel events in this scroll" determination.
          // If 1-4 aren't satisfied, then wait to snap until 500ms after the last event.
          clearTimeout(timeout);
          timeout = undefined;
          if (recentWheelEvents.length >= 15) {
            recentWheelEvents.shift(); // only store the last N events
          }

          const prevEvent = recentWheelEvents.length ? recentWheelEvents[recentWheelEvents.length - 1] : undefined;
          const firstEvent = recentWheelEvents[0];
          recentWheelEvents.push(newEvent);
          if (prevEvent && (newEvent.delta > prevEvent.delta || newEvent.direction !== prevEvent.direction)) {
            // Increasing or reverse-sign delta means the user started scrolling again. Clear the wheel event log.
            recentWheelEvents.splice(0);
          } else if (recentWheelEvents.length >= 15 && newEvent.time - firstEvent.time < 500 && firstEvent.delta - newEvent.delta >= 1 && newEvent.delta <= 6) {
            // We're at the end of the deceleration of a momentum scroll, so there's no need
            // to wait for more events. Snap ASAP on the next tick.
            // Also, because there's some remaining momentum we'll bias the snap in the
            // direction of the ongoing scroll because it's better UX for the scroll to snap
            // in the same direction as the scroll instead of reversing to snap.  Therefore,
            // if it's already scrolled more than 20% in the current direction, keep going.
            const snapToThreshold = delta > 0 ? 0.8 : 0.2;
            lastEventBeforeSnap = newEvent;
            recentWheelEvents.splice(0);
            timeout = nextTick(() => {
              if (swiper.destroyed || !swiper.params) return;
              swiper.slideToClosest(swiper.params.speed, true, undefined, snapToThreshold);
            }, 0); // no delay; move on next tick
          }

          if (!timeout) {
            // if we get here, then we haven't detected the end of a momentum scroll, so
            // we'll consider a scroll "complete" when there haven't been any wheel events
            // for 500ms.
            timeout = nextTick(() => {
              if (swiper.destroyed || !swiper.params) return;
              const snapToThreshold = 0.5;
              lastEventBeforeSnap = newEvent;
              recentWheelEvents.splice(0);
              swiper.slideToClosest(swiper.params.speed, true, undefined, snapToThreshold);
            }, 500);
          }
        }

        // Emit event
        if (!ignoreWheelEvents) emit('scroll', e);

        // Stop autoplay
        if (swiper.params.autoplay && swiper.params.autoplay.disableOnInteraction) swiper.autoplay.stop();
        // Return page scroll on edge positions
        if (params.releaseOnEdges && (position === swiper.minTranslate() || position === swiper.maxTranslate())) {
          return true;
        }
      }
    }
    if (e.preventDefault) e.preventDefault();else e.returnValue = false;
    return false;
  }
  function events(method) {
    let targetEl = swiper.el;
    if (swiper.params.mousewheel.eventsTarget !== 'container') {
      targetEl = document.querySelector(swiper.params.mousewheel.eventsTarget);
    }
    targetEl[method]('mouseenter', handleMouseEnter);
    targetEl[method]('mouseleave', handleMouseLeave);
    targetEl[method]('wheel', handle);
  }
  function enable() {
    if (swiper.params.cssMode) {
      swiper.wrapperEl.removeEventListener('wheel', handle);
      return true;
    }
    if (swiper.mousewheel.enabled) return false;
    events('addEventListener');
    swiper.mousewheel.enabled = true;
    return true;
  }
  function disable() {
    if (swiper.params.cssMode) {
      swiper.wrapperEl.addEventListener(event, handle);
      return true;
    }
    if (!swiper.mousewheel.enabled) return false;
    events('removeEventListener');
    swiper.mousewheel.enabled = false;
    return true;
  }
  on('init', () => {
    if (!swiper.params.mousewheel.enabled && swiper.params.cssMode) {
      disable();
    }
    if (swiper.params.mousewheel.enabled) enable();
  });
  on('destroy', () => {
    if (swiper.params.cssMode) {
      enable();
    }
    if (swiper.mousewheel.enabled) disable();
  });
  Object.assign(swiper.mousewheel, {
    enable,
    disable
  });
}

function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
  if (swiper.params.createElements) {
    Object.keys(checkProps).forEach(key => {
      if (!params[key] && params.auto === true) {
        let element = elementChildren(swiper.el, `.${checkProps[key]}`)[0];
        if (!element) {
          element = createElement('div', checkProps[key]);
          element.className = checkProps[key];
          swiper.el.append(element);
        }
        params[key] = element;
        originalParams[key] = element;
      }
    });
  }
  return params;
}

const arrowSvg = `<svg class="swiper-navigation-icon" width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z" fill="currentColor"/></svg>`;
function Navigation({
  swiper,
  extendParams,
  on,
  emit
}) {
  extendParams({
    navigation: {
      nextEl: null,
      prevEl: null,
      addIcons: true,
      hideOnClick: false,
      disabledClass: 'swiper-button-disabled',
      hiddenClass: 'swiper-button-hidden',
      lockClass: 'swiper-button-lock',
      navigationDisabledClass: 'swiper-navigation-disabled'
    }
  });
  swiper.navigation = {
    nextEl: null,
    prevEl: null,
    arrowSvg
  };
  function getEl(el) {
    let res;
    if (el && typeof el === 'string' && swiper.isElement) {
      res = swiper.el.querySelector(el) || swiper.hostEl.querySelector(el);
      if (res) return res;
    }
    if (el) {
      if (typeof el === 'string') res = [...document.querySelectorAll(el)];
      if (swiper.params.uniqueNavElements && typeof el === 'string' && res && res.length > 1 && swiper.el.querySelectorAll(el).length === 1) {
        res = swiper.el.querySelector(el);
      } else if (res && res.length === 1) {
        res = res[0];
      }
    }
    if (el && !res) return el;
    // if (Array.isArray(res) && res.length === 1) res = res[0];
    return res;
  }
  function toggleEl(el, disabled) {
    const params = swiper.params.navigation;
    el = makeElementsArray(el);
    el.forEach(subEl => {
      if (subEl) {
        subEl.classList[disabled ? 'add' : 'remove'](...params.disabledClass.split(' '));
        if (subEl.tagName === 'BUTTON') subEl.disabled = disabled;
        if (swiper.params.watchOverflow && swiper.enabled) {
          subEl.classList[swiper.isLocked ? 'add' : 'remove'](params.lockClass);
        }
      }
    });
  }
  function update() {
    // Update Navigation Buttons
    const {
      nextEl,
      prevEl
    } = swiper.navigation;
    if (swiper.params.loop) {
      toggleEl(prevEl, false);
      toggleEl(nextEl, false);
      return;
    }
    toggleEl(prevEl, swiper.isBeginning && !swiper.params.rewind);
    toggleEl(nextEl, swiper.isEnd && !swiper.params.rewind);
  }
  function onPrevClick(e) {
    e.preventDefault();
    if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind) return;
    swiper.slidePrev();
    emit('navigationPrev');
  }
  function onNextClick(e) {
    e.preventDefault();
    if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind) return;
    swiper.slideNext();
    emit('navigationNext');
  }
  function init() {
    const params = swiper.params.navigation;
    swiper.params.navigation = createElementIfNotDefined(swiper, swiper.originalParams.navigation, swiper.params.navigation, {
      nextEl: 'swiper-button-next',
      prevEl: 'swiper-button-prev'
    });
    if (!(params.nextEl || params.prevEl)) return;
    let nextEl = getEl(params.nextEl);
    let prevEl = getEl(params.prevEl);
    Object.assign(swiper.navigation, {
      nextEl,
      prevEl
    });
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const initButton = (el, dir) => {
      if (el) {
        if (params.addIcons && el.matches('.swiper-button-next,.swiper-button-prev') && !el.querySelector('svg')) {
          const tempEl = document.createElement('div');
          setInnerHTML(tempEl, arrowSvg);
          el.appendChild(tempEl.querySelector('svg'));
          tempEl.remove();
        }
        el.addEventListener('click', dir === 'next' ? onNextClick : onPrevClick);
      }
      if (!swiper.enabled && el) {
        el.classList.add(...params.lockClass.split(' '));
      }
    };
    nextEl.forEach(el => initButton(el, 'next'));
    prevEl.forEach(el => initButton(el, 'prev'));
  }
  function destroy() {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const destroyButton = (el, dir) => {
      el.removeEventListener('click', dir === 'next' ? onNextClick : onPrevClick);
      el.classList.remove(...swiper.params.navigation.disabledClass.split(' '));
    };
    nextEl.forEach(el => destroyButton(el, 'next'));
    prevEl.forEach(el => destroyButton(el, 'prev'));
  }
  on('init', () => {
    if (swiper.params.navigation.enabled === false) {
      // eslint-disable-next-line
      disable();
    } else {
      init();
      update();
    }
  });
  on('toEdge fromEdge lock unlock', () => {
    update();
  });
  on('destroy', () => {
    destroy();
  });
  on('enable disable', () => {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (swiper.enabled) {
      update();
      return;
    }
    [...nextEl, ...prevEl].filter(el => !!el).forEach(el => el.classList.add(swiper.params.navigation.lockClass));
  });
  on('click', (_s, e) => {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const targetEl = e.target;
    let targetIsButton = prevEl.includes(targetEl) || nextEl.includes(targetEl);
    if (swiper.isElement && !targetIsButton) {
      const path = e.path || e.composedPath && e.composedPath();
      if (path) {
        targetIsButton = path.find(pathEl => nextEl.includes(pathEl) || prevEl.includes(pathEl));
      }
    }
    if (swiper.params.navigation.hideOnClick && !targetIsButton) {
      if (swiper.pagination && swiper.params.pagination && swiper.params.pagination.clickable && (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl))) return;
      let isHidden;
      if (nextEl.length) {
        isHidden = nextEl[0].classList.contains(swiper.params.navigation.hiddenClass);
      } else if (prevEl.length) {
        isHidden = prevEl[0].classList.contains(swiper.params.navigation.hiddenClass);
      }
      if (isHidden === true) {
        emit('navigationShow');
      } else {
        emit('navigationHide');
      }
      [...nextEl, ...prevEl].filter(el => !!el).forEach(el => el.classList.toggle(swiper.params.navigation.hiddenClass));
    }
  });
  const enable = () => {
    swiper.el.classList.remove(...swiper.params.navigation.navigationDisabledClass.split(' '));
    init();
    update();
  };
  const disable = () => {
    swiper.el.classList.add(...swiper.params.navigation.navigationDisabledClass.split(' '));
    destroy();
  };
  Object.assign(swiper.navigation, {
    enable,
    disable,
    update,
    init,
    destroy
  });
}

function classesToSelector(classes = '') {
  // Escape all CSS selector special characters
  return `.${classes.trim().replace(/([\.:!+\/()[\]#>~*^$|=,'"@{}\\])/g, '\\$1') // eslint-disable-line
  .replace(/ /g, '.')}`;
}

function Pagination({
  swiper,
  extendParams,
  on,
  emit
}) {
  const pfx = 'swiper-pagination';
  extendParams({
    pagination: {
      el: null,
      bulletElement: 'span',
      clickable: false,
      hideOnClick: false,
      renderBullet: null,
      renderProgressbar: null,
      renderFraction: null,
      renderCustom: null,
      progressbarOpposite: false,
      type: 'bullets',
      // 'bullets' or 'progressbar' or 'fraction' or 'custom'
      dynamicBullets: false,
      dynamicMainBullets: 1,
      formatFractionCurrent: number => number,
      formatFractionTotal: number => number,
      bulletClass: `${pfx}-bullet`,
      bulletActiveClass: `${pfx}-bullet-active`,
      modifierClass: `${pfx}-`,
      currentClass: `${pfx}-current`,
      totalClass: `${pfx}-total`,
      hiddenClass: `${pfx}-hidden`,
      progressbarFillClass: `${pfx}-progressbar-fill`,
      progressbarOppositeClass: `${pfx}-progressbar-opposite`,
      clickableClass: `${pfx}-clickable`,
      lockClass: `${pfx}-lock`,
      horizontalClass: `${pfx}-horizontal`,
      verticalClass: `${pfx}-vertical`,
      paginationDisabledClass: `${pfx}-disabled`
    }
  });
  swiper.pagination = {
    el: null,
    bullets: []
  };
  let bulletSize;
  let dynamicBulletIndex = 0;
  function isPaginationDisabled() {
    return !swiper.params.pagination.el || !swiper.pagination.el || Array.isArray(swiper.pagination.el) && swiper.pagination.el.length === 0;
  }
  function setSideBullets(bulletEl, position) {
    const {
      bulletActiveClass
    } = swiper.params.pagination;
    if (!bulletEl) return;
    bulletEl = bulletEl[`${position === 'prev' ? 'previous' : 'next'}ElementSibling`];
    if (bulletEl) {
      bulletEl.classList.add(`${bulletActiveClass}-${position}`);
      bulletEl = bulletEl[`${position === 'prev' ? 'previous' : 'next'}ElementSibling`];
      if (bulletEl) {
        bulletEl.classList.add(`${bulletActiveClass}-${position}-${position}`);
      }
    }
  }
  function getMoveDirection(prevIndex, nextIndex, length) {
    prevIndex = prevIndex % length;
    nextIndex = nextIndex % length;
    if (nextIndex === prevIndex + 1) {
      return 'next';
    } else if (nextIndex === prevIndex - 1) {
      return 'previous';
    }
    return;
  }
  function onBulletClick(e) {
    const bulletEl = e.target.closest(classesToSelector(swiper.params.pagination.bulletClass));
    if (!bulletEl) {
      return;
    }
    e.preventDefault();
    const index = elementIndex(bulletEl) * swiper.params.slidesPerGroup;
    if (swiper.params.loop) {
      if (swiper.realIndex === index) return;
      const moveDirection = getMoveDirection(swiper.realIndex, index, swiper.slides.length);
      if (moveDirection === 'next') {
        swiper.slideNext();
      } else if (moveDirection === 'previous') {
        swiper.slidePrev();
      } else {
        swiper.slideToLoop(index);
      }
    } else {
      swiper.slideTo(index);
    }
  }
  function update() {
    // Render || Update Pagination bullets/items
    const rtl = swiper.rtl;
    const params = swiper.params.pagination;
    if (isPaginationDisabled()) return;
    let el = swiper.pagination.el;
    el = makeElementsArray(el);
    // Current/Total
    let current;
    let previousIndex;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
    const total = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
    if (swiper.params.loop) {
      previousIndex = swiper.previousRealIndex || 0;
      current = swiper.params.slidesPerGroup > 1 ? Math.floor(swiper.realIndex / swiper.params.slidesPerGroup) : swiper.realIndex;
    } else if (typeof swiper.snapIndex !== 'undefined') {
      current = swiper.snapIndex;
      previousIndex = swiper.previousSnapIndex;
    } else {
      previousIndex = swiper.previousIndex || 0;
      current = swiper.activeIndex || 0;
    }
    // Types
    if (params.type === 'bullets' && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
      const bullets = swiper.pagination.bullets;
      let firstIndex;
      let lastIndex;
      let midIndex;
      if (params.dynamicBullets) {
        bulletSize = elementOuterSize(bullets[0], swiper.isHorizontal() ? 'width' : 'height');
        el.forEach(subEl => {
          subEl.style[swiper.isHorizontal() ? 'width' : 'height'] = `${bulletSize * (params.dynamicMainBullets + 4)}px`;
        });
        if (params.dynamicMainBullets > 1 && previousIndex !== undefined) {
          dynamicBulletIndex += current - (previousIndex || 0);
          if (dynamicBulletIndex > params.dynamicMainBullets - 1) {
            dynamicBulletIndex = params.dynamicMainBullets - 1;
          } else if (dynamicBulletIndex < 0) {
            dynamicBulletIndex = 0;
          }
        }
        firstIndex = Math.max(current - dynamicBulletIndex, 0);
        lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
        midIndex = (lastIndex + firstIndex) / 2;
      }
      bullets.forEach(bulletEl => {
        const classesToRemove = [...['', '-next', '-next-next', '-prev', '-prev-prev', '-main'].map(suffix => `${params.bulletActiveClass}${suffix}`)].map(s => typeof s === 'string' && s.includes(' ') ? s.split(' ') : s).flat();
        bulletEl.classList.remove(...classesToRemove);
      });
      if (el.length > 1) {
        bullets.forEach(bullet => {
          const bulletIndex = elementIndex(bullet);
          if (bulletIndex === current) {
            bullet.classList.add(...params.bulletActiveClass.split(' '));
          } else if (swiper.isElement) {
            bullet.setAttribute('part', 'bullet');
          }
          if (params.dynamicBullets) {
            if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
              bullet.classList.add(...`${params.bulletActiveClass}-main`.split(' '));
            }
            if (bulletIndex === firstIndex) {
              setSideBullets(bullet, 'prev');
            }
            if (bulletIndex === lastIndex) {
              setSideBullets(bullet, 'next');
            }
          }
        });
      } else {
        const bullet = bullets[current];
        if (bullet) {
          bullet.classList.add(...params.bulletActiveClass.split(' '));
        }
        if (swiper.isElement) {
          bullets.forEach((bulletEl, bulletIndex) => {
            bulletEl.setAttribute('part', bulletIndex === current ? 'bullet-active' : 'bullet');
          });
        }
        if (params.dynamicBullets) {
          const firstDisplayedBullet = bullets[firstIndex];
          const lastDisplayedBullet = bullets[lastIndex];
          for (let i = firstIndex; i <= lastIndex; i += 1) {
            if (bullets[i]) {
              bullets[i].classList.add(...`${params.bulletActiveClass}-main`.split(' '));
            }
          }
          setSideBullets(firstDisplayedBullet, 'prev');
          setSideBullets(lastDisplayedBullet, 'next');
        }
      }
      if (params.dynamicBullets) {
        const dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
        const bulletsOffset = (bulletSize * dynamicBulletsLength - bulletSize) / 2 - midIndex * bulletSize;
        const offsetProp = rtl ? 'right' : 'left';
        bullets.forEach(bullet => {
          bullet.style[swiper.isHorizontal() ? offsetProp : 'top'] = `${bulletsOffset}px`;
        });
      }
    }
    el.forEach((subEl, subElIndex) => {
      if (params.type === 'fraction') {
        subEl.querySelectorAll(classesToSelector(params.currentClass)).forEach(fractionEl => {
          fractionEl.textContent = params.formatFractionCurrent(current + 1);
        });
        subEl.querySelectorAll(classesToSelector(params.totalClass)).forEach(totalEl => {
          totalEl.textContent = params.formatFractionTotal(total);
        });
      }
      if (params.type === 'progressbar') {
        let progressbarDirection;
        if (params.progressbarOpposite) {
          progressbarDirection = swiper.isHorizontal() ? 'vertical' : 'horizontal';
        } else {
          progressbarDirection = swiper.isHorizontal() ? 'horizontal' : 'vertical';
        }
        const scale = (current + 1) / total;
        let scaleX = 1;
        let scaleY = 1;
        if (progressbarDirection === 'horizontal') {
          scaleX = scale;
        } else {
          scaleY = scale;
        }
        subEl.querySelectorAll(classesToSelector(params.progressbarFillClass)).forEach(progressEl => {
          progressEl.style.transform = `translate3d(0,0,0) scaleX(${scaleX}) scaleY(${scaleY})`;
          progressEl.style.transitionDuration = `${swiper.params.speed}ms`;
        });
      }
      if (params.type === 'custom' && params.renderCustom) {
        setInnerHTML(subEl, params.renderCustom(swiper, current + 1, total));
        if (subElIndex === 0) emit('paginationRender', subEl);
      } else {
        if (subElIndex === 0) emit('paginationRender', subEl);
        emit('paginationUpdate', subEl);
      }
      if (swiper.params.watchOverflow && swiper.enabled) {
        subEl.classList[swiper.isLocked ? 'add' : 'remove'](params.lockClass);
      }
    });
  }
  function render() {
    // Render Container
    const params = swiper.params.pagination;
    if (isPaginationDisabled()) return;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.grid && swiper.params.grid.rows > 1 ? swiper.slides.length / Math.ceil(swiper.params.grid.rows) : swiper.slides.length;
    let el = swiper.pagination.el;
    el = makeElementsArray(el);
    let paginationHTML = '';
    if (params.type === 'bullets') {
      let numberOfBullets = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
      if (swiper.params.freeMode && swiper.params.freeMode.enabled && numberOfBullets > slidesLength) {
        numberOfBullets = slidesLength;
      }
      for (let i = 0; i < numberOfBullets; i += 1) {
        if (params.renderBullet) {
          paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
        } else {
          // prettier-ignore
          paginationHTML += `<${params.bulletElement} ${swiper.isElement ? 'part="bullet"' : ''} class="${params.bulletClass}"></${params.bulletElement}>`;
        }
      }
    }
    if (params.type === 'fraction') {
      if (params.renderFraction) {
        paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
      } else {
        paginationHTML = `<span class="${params.currentClass}"></span>` + ' / ' + `<span class="${params.totalClass}"></span>`;
      }
    }
    if (params.type === 'progressbar') {
      if (params.renderProgressbar) {
        paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
      } else {
        paginationHTML = `<span class="${params.progressbarFillClass}"></span>`;
      }
    }
    swiper.pagination.bullets = [];
    el.forEach(subEl => {
      if (params.type !== 'custom') {
        setInnerHTML(subEl, paginationHTML || '');
      }
      if (params.type === 'bullets') {
        swiper.pagination.bullets.push(...subEl.querySelectorAll(classesToSelector(params.bulletClass)));
      }
    });
    if (params.type !== 'custom') {
      emit('paginationRender', el[0]);
    }
  }
  function init() {
    swiper.params.pagination = createElementIfNotDefined(swiper, swiper.originalParams.pagination, swiper.params.pagination, {
      el: 'swiper-pagination'
    });
    const params = swiper.params.pagination;
    if (!params.el) return;
    let el;
    if (typeof params.el === 'string' && swiper.isElement) {
      el = swiper.el.querySelector(params.el);
    }
    if (!el && typeof params.el === 'string') {
      el = [...document.querySelectorAll(params.el)];
    }
    if (!el) {
      el = params.el;
    }
    if (!el || el.length === 0) return;
    if (swiper.params.uniqueNavElements && typeof params.el === 'string' && Array.isArray(el) && el.length > 1) {
      el = [...swiper.el.querySelectorAll(params.el)];
      // check if it belongs to another nested Swiper
      if (el.length > 1) {
        el = el.find(subEl => {
          if (elementParents(subEl, '.swiper')[0] !== swiper.el) return false;
          return true;
        });
      }
    }
    if (Array.isArray(el) && el.length === 1) el = el[0];
    Object.assign(swiper.pagination, {
      el
    });
    el = makeElementsArray(el);
    el.forEach(subEl => {
      if (params.type === 'bullets' && params.clickable) {
        subEl.classList.add(...(params.clickableClass || '').split(' '));
      }
      subEl.classList.add(params.modifierClass + params.type);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
      if (params.type === 'bullets' && params.dynamicBullets) {
        subEl.classList.add(`${params.modifierClass}${params.type}-dynamic`);
        dynamicBulletIndex = 0;
        if (params.dynamicMainBullets < 1) {
          params.dynamicMainBullets = 1;
        }
      }
      if (params.type === 'progressbar' && params.progressbarOpposite) {
        subEl.classList.add(params.progressbarOppositeClass);
      }
      if (params.clickable) {
        subEl.addEventListener('click', onBulletClick);
      }
      if (!swiper.enabled) {
        subEl.classList.add(params.lockClass);
      }
    });
  }
  function destroy() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled()) return;
    let el = swiper.pagination.el;
    if (el) {
      el = makeElementsArray(el);
      el.forEach(subEl => {
        subEl.classList.remove(params.hiddenClass);
        subEl.classList.remove(params.modifierClass + params.type);
        subEl.classList.remove(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
        if (params.clickable) {
          subEl.classList.remove(...(params.clickableClass || '').split(' '));
          subEl.removeEventListener('click', onBulletClick);
        }
      });
    }
    if (swiper.pagination.bullets) swiper.pagination.bullets.forEach(subEl => subEl.classList.remove(...params.bulletActiveClass.split(' ')));
  }
  on('changeDirection', () => {
    if (!swiper.pagination || !swiper.pagination.el) return;
    const params = swiper.params.pagination;
    let {
      el
    } = swiper.pagination;
    el = makeElementsArray(el);
    el.forEach(subEl => {
      subEl.classList.remove(params.horizontalClass, params.verticalClass);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
    });
  });
  on('init', () => {
    if (swiper.params.pagination.enabled === false) {
      // eslint-disable-next-line
      disable();
    } else {
      init();
      render();
      update();
    }
  });
  on('activeIndexChange', () => {
    if (typeof swiper.snapIndex === 'undefined') {
      update();
    }
  });
  on('snapIndexChange', () => {
    update();
  });
  on('snapGridLengthChange', () => {
    render();
    update();
  });
  on('destroy', () => {
    destroy();
  });
  on('enable disable', () => {
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach(subEl => subEl.classList[swiper.enabled ? 'remove' : 'add'](swiper.params.pagination.lockClass));
    }
  });
  on('lock unlock', () => {
    update();
  });
  on('click', (_s, e) => {
    const targetEl = e.target;
    const el = makeElementsArray(swiper.pagination.el);
    if (swiper.params.pagination.el && swiper.params.pagination.hideOnClick && el && el.length > 0 && !targetEl.classList.contains(swiper.params.pagination.bulletClass)) {
      if (swiper.navigation && (swiper.navigation.nextEl && targetEl === swiper.navigation.nextEl || swiper.navigation.prevEl && targetEl === swiper.navigation.prevEl)) return;
      const isHidden = el[0].classList.contains(swiper.params.pagination.hiddenClass);
      if (isHidden === true) {
        emit('paginationShow');
      } else {
        emit('paginationHide');
      }
      el.forEach(subEl => subEl.classList.toggle(swiper.params.pagination.hiddenClass));
    }
  });
  const enable = () => {
    swiper.el.classList.remove(swiper.params.pagination.paginationDisabledClass);
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach(subEl => subEl.classList.remove(swiper.params.pagination.paginationDisabledClass));
    }
    init();
    render();
    update();
  };
  const disable = () => {
    swiper.el.classList.add(swiper.params.pagination.paginationDisabledClass);
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach(subEl => subEl.classList.add(swiper.params.pagination.paginationDisabledClass));
    }
    destroy();
  };
  Object.assign(swiper.pagination, {
    enable,
    disable,
    render,
    update,
    init,
    destroy
  });
}

function Scrollbar({
  swiper,
  extendParams,
  on,
  emit
}) {
  const document = getDocument();
  let isTouched = false;
  let timeout = null;
  let dragTimeout = null;
  let dragStartPos;
  let dragSize;
  let trackSize;
  let divider;
  extendParams({
    scrollbar: {
      el: null,
      dragSize: 'auto',
      hide: false,
      draggable: false,
      snapOnRelease: true,
      lockClass: 'swiper-scrollbar-lock',
      dragClass: 'swiper-scrollbar-drag',
      scrollbarDisabledClass: 'swiper-scrollbar-disabled',
      horizontalClass: `swiper-scrollbar-horizontal`,
      verticalClass: `swiper-scrollbar-vertical`
    }
  });
  swiper.scrollbar = {
    el: null,
    dragEl: null
  };
  function setTranslate() {
    if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
    const {
      scrollbar,
      rtlTranslate: rtl
    } = swiper;
    const {
      dragEl,
      el
    } = scrollbar;
    const params = swiper.params.scrollbar;
    const progress = swiper.params.loop ? swiper.progressLoop : swiper.progress;
    let newSize = dragSize;
    let newPos = (trackSize - dragSize) * progress;
    if (rtl) {
      newPos = -newPos;
      if (newPos > 0) {
        newSize = dragSize - newPos;
        newPos = 0;
      } else if (-newPos + dragSize > trackSize) {
        newSize = trackSize + newPos;
      }
    } else if (newPos < 0) {
      newSize = dragSize + newPos;
      newPos = 0;
    } else if (newPos + dragSize > trackSize) {
      newSize = trackSize - newPos;
    }
    if (swiper.isHorizontal()) {
      dragEl.style.transform = `translate3d(${newPos}px, 0, 0)`;
      dragEl.style.width = `${newSize}px`;
    } else {
      dragEl.style.transform = `translate3d(0px, ${newPos}px, 0)`;
      dragEl.style.height = `${newSize}px`;
    }
    if (params.hide) {
      clearTimeout(timeout);
      el.style.opacity = 1;
      timeout = setTimeout(() => {
        el.style.opacity = 0;
        el.style.transitionDuration = '400ms';
      }, 1000);
    }
  }
  function setTransition(duration) {
    if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
    swiper.scrollbar.dragEl.style.transitionDuration = `${duration}ms`;
  }
  function updateSize() {
    if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
    const {
      scrollbar
    } = swiper;
    const {
      dragEl,
      el
    } = scrollbar;
    dragEl.style.width = '';
    dragEl.style.height = '';
    trackSize = swiper.isHorizontal() ? el.offsetWidth : el.offsetHeight;
    divider = swiper.size / (swiper.virtualSize + swiper.params.slidesOffsetBefore - (swiper.params.centeredSlides ? swiper.snapGrid[0] : 0));
    if (swiper.params.scrollbar.dragSize === 'auto') {
      dragSize = trackSize * divider;
    } else {
      dragSize = parseInt(swiper.params.scrollbar.dragSize, 10);
    }
    if (swiper.isHorizontal()) {
      dragEl.style.width = `${dragSize}px`;
    } else {
      dragEl.style.height = `${dragSize}px`;
    }
    if (divider >= 1) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
    if (swiper.params.scrollbar.hide) {
      el.style.opacity = 0;
    }
    if (swiper.params.watchOverflow && swiper.enabled) {
      scrollbar.el.classList[swiper.isLocked ? 'add' : 'remove'](swiper.params.scrollbar.lockClass);
    }
  }
  function getPointerPosition(e) {
    return swiper.isHorizontal() ? e.clientX : e.clientY;
  }
  function setDragPosition(e) {
    const {
      scrollbar,
      rtlTranslate: rtl
    } = swiper;
    const {
      el
    } = scrollbar;
    let positionRatio;
    positionRatio = (getPointerPosition(e) - elementOffset(el)[swiper.isHorizontal() ? 'left' : 'top'] - (dragStartPos !== null ? dragStartPos : dragSize / 2)) / (trackSize - dragSize);
    positionRatio = Math.max(Math.min(positionRatio, 1), 0);
    if (rtl) {
      positionRatio = 1 - positionRatio;
    }
    const position = swiper.minTranslate() + (swiper.maxTranslate() - swiper.minTranslate()) * positionRatio;
    swiper.updateProgress(position);
    swiper.setTranslate(position);
    swiper.updateActiveIndex();
    swiper.updateSlidesClasses();
  }
  function onDragStart(e) {
    const params = swiper.params.scrollbar;
    const {
      scrollbar,
      wrapperEl
    } = swiper;
    const {
      el,
      dragEl
    } = scrollbar;
    isTouched = true;
    dragStartPos = e.target === dragEl ? getPointerPosition(e) - e.target.getBoundingClientRect()[swiper.isHorizontal() ? 'left' : 'top'] : null;
    e.preventDefault();
    e.stopPropagation();
    wrapperEl.style.transitionDuration = '100ms';
    dragEl.style.transitionDuration = '100ms';
    setDragPosition(e);
    clearTimeout(dragTimeout);
    el.style.transitionDuration = '0ms';
    if (params.hide) {
      el.style.opacity = 1;
    }
    if (swiper.params.cssMode) {
      swiper.wrapperEl.style['scroll-snap-type'] = 'none';
    }
    emit('scrollbarDragStart', e);
  }
  function onDragMove(e) {
    const {
      scrollbar,
      wrapperEl
    } = swiper;
    const {
      el,
      dragEl
    } = scrollbar;
    if (!isTouched) return;
    if (e.preventDefault && e.cancelable) e.preventDefault();else e.returnValue = false;
    setDragPosition(e);
    wrapperEl.style.transitionDuration = '0ms';
    el.style.transitionDuration = '0ms';
    dragEl.style.transitionDuration = '0ms';
    emit('scrollbarDragMove', e);
  }
  function onDragEnd(e) {
    const params = swiper.params.scrollbar;
    const {
      scrollbar,
      wrapperEl
    } = swiper;
    const {
      el
    } = scrollbar;
    if (!isTouched) return;
    isTouched = false;
    if (swiper.params.cssMode) {
      swiper.wrapperEl.style['scroll-snap-type'] = '';
      wrapperEl.style.transitionDuration = '';
    }
    if (params.hide) {
      clearTimeout(dragTimeout);
      dragTimeout = nextTick(() => {
        el.style.opacity = 0;
        el.style.transitionDuration = '400ms';
      }, 1000);
    }
    emit('scrollbarDragEnd', e);
    if (params.snapOnRelease) {
      swiper.slideToClosest();
    }
  }
  function events(method) {
    const {
      scrollbar,
      params
    } = swiper;
    const el = scrollbar.el;
    if (!el) return;
    const target = el;
    const activeListener = params.passiveListeners ? {
      passive: false,
      capture: false
    } : false;
    const passiveListener = params.passiveListeners ? {
      passive: true,
      capture: false
    } : false;
    if (!target) return;
    const eventMethod = method === 'on' ? 'addEventListener' : 'removeEventListener';
    target[eventMethod]('pointerdown', onDragStart, activeListener);
    document[eventMethod]('pointermove', onDragMove, activeListener);
    document[eventMethod]('pointerup', onDragEnd, passiveListener);
  }
  function enableDraggable() {
    if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
    events('on');
  }
  function disableDraggable() {
    if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
    events('off');
  }
  function init() {
    const {
      scrollbar,
      el: swiperEl
    } = swiper;
    swiper.params.scrollbar = createElementIfNotDefined(swiper, swiper.originalParams.scrollbar, swiper.params.scrollbar, {
      el: 'swiper-scrollbar'
    });
    const params = swiper.params.scrollbar;
    if (!params.el) return;
    let el;
    if (typeof params.el === 'string' && swiper.isElement) {
      el = swiper.el.querySelector(params.el);
    }
    if (!el && typeof params.el === 'string') {
      el = document.querySelectorAll(params.el);
      if (!el.length) return;
    } else if (!el) {
      el = params.el;
    }
    if (swiper.params.uniqueNavElements && typeof params.el === 'string' && el.length > 1 && swiperEl.querySelectorAll(params.el).length === 1) {
      el = swiperEl.querySelector(params.el);
    }
    if (el.length > 0) el = el[0];
    el.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
    let dragEl;
    if (el) {
      dragEl = el.querySelector(classesToSelector(swiper.params.scrollbar.dragClass));
      if (!dragEl) {
        dragEl = createElement('div', swiper.params.scrollbar.dragClass);
        el.append(dragEl);
      }
    }
    Object.assign(scrollbar, {
      el,
      dragEl
    });
    if (params.draggable) {
      enableDraggable();
    }
    if (el) {
      el.classList[swiper.enabled ? 'remove' : 'add'](...classesToTokens(swiper.params.scrollbar.lockClass));
    }
  }
  function destroy() {
    const params = swiper.params.scrollbar;
    const el = swiper.scrollbar.el;
    if (el) {
      el.classList.remove(...classesToTokens(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass));
    }
    disableDraggable();
  }
  on('changeDirection', () => {
    if (!swiper.scrollbar || !swiper.scrollbar.el) return;
    const params = swiper.params.scrollbar;
    let {
      el
    } = swiper.scrollbar;
    el = makeElementsArray(el);
    el.forEach(subEl => {
      subEl.classList.remove(params.horizontalClass, params.verticalClass);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
    });
  });
  on('init', () => {
    if (swiper.params.scrollbar.enabled === false) {
      // eslint-disable-next-line
      disable();
    } else {
      init();
      updateSize();
      setTranslate();
    }
  });
  on('update resize observerUpdate lock unlock changeDirection', () => {
    updateSize();
  });
  on('setTranslate', () => {
    setTranslate();
  });
  on('setTransition', (_s, duration) => {
    setTransition(duration);
  });
  on('enable disable', () => {
    const {
      el
    } = swiper.scrollbar;
    if (el) {
      el.classList[swiper.enabled ? 'remove' : 'add'](...classesToTokens(swiper.params.scrollbar.lockClass));
    }
  });
  on('destroy', () => {
    destroy();
  });
  const enable = () => {
    swiper.el.classList.remove(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
    if (swiper.scrollbar.el) {
      swiper.scrollbar.el.classList.remove(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
    }
    init();
    updateSize();
    setTranslate();
  };
  const disable = () => {
    swiper.el.classList.add(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
    if (swiper.scrollbar.el) {
      swiper.scrollbar.el.classList.add(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
    }
    destroy();
  };
  Object.assign(swiper.scrollbar, {
    enable,
    disable,
    updateSize,
    setTranslate,
    init,
    destroy
  });
}

/* eslint no-underscore-dangle: "off" */
/* eslint no-use-before-define: "off" */
function Autoplay({
  swiper,
  extendParams,
  on,
  emit,
  params
}) {
  swiper.autoplay = {
    running: false,
    paused: false,
    timeLeft: 0
  };
  extendParams({
    autoplay: {
      enabled: false,
      delay: 3000,
      waitForTransition: true,
      disableOnInteraction: false,
      stopOnLastSlide: false,
      reverseDirection: false,
      pauseOnMouseEnter: false
    }
  });
  let timeout;
  let raf;
  let autoplayDelayTotal = params && params.autoplay ? params.autoplay.delay : 3000;
  let autoplayDelayCurrent = params && params.autoplay ? params.autoplay.delay : 3000;
  let autoplayTimeLeft;
  let autoplayStartTime = new Date().getTime();
  let wasPaused;
  let isTouched;
  let pausedByTouch;
  let touchStartTimeout;
  let pausedByInteraction;
  let pausedByPointerEnter;
  function onTransitionEnd(e) {
    if (!swiper || swiper.destroyed || !swiper.wrapperEl) return;
    if (e.target !== swiper.wrapperEl) return;
    swiper.wrapperEl.removeEventListener('transitionend', onTransitionEnd);
    if (pausedByPointerEnter || e.detail && e.detail.bySwiperTouchMove) {
      return;
    }
    resume();
  }
  const calcTimeLeft = () => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    if (swiper.autoplay.paused) {
      wasPaused = true;
    } else if (wasPaused) {
      autoplayDelayCurrent = autoplayTimeLeft;
      wasPaused = false;
    }
    const timeLeft = swiper.autoplay.paused ? autoplayTimeLeft : autoplayStartTime + autoplayDelayCurrent - new Date().getTime();
    swiper.autoplay.timeLeft = timeLeft;
    emit('autoplayTimeLeft', timeLeft, timeLeft / autoplayDelayTotal);
    raf = requestAnimationFrame(() => {
      calcTimeLeft();
    });
  };
  const getSlideDelay = () => {
    let activeSlideEl;
    if (swiper.virtual && swiper.params.virtual.enabled) {
      activeSlideEl = swiper.slides.find(slideEl => slideEl.classList.contains('swiper-slide-active'));
    } else {
      activeSlideEl = swiper.slides[swiper.activeIndex];
    }
    if (!activeSlideEl) return undefined;
    const currentSlideDelay = parseInt(activeSlideEl.getAttribute('data-swiper-autoplay'), 10);
    return currentSlideDelay;
  };
  const getTotalDelay = () => {
    let totalDelay = swiper.params.autoplay.delay;
    const currentSlideDelay = getSlideDelay();
    if (!Number.isNaN(currentSlideDelay) && currentSlideDelay > 0) {
      totalDelay = currentSlideDelay;
    }
    return totalDelay;
  };
  const run = delayForce => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    cancelAnimationFrame(raf);
    calcTimeLeft();
    let delay = delayForce;
    if (typeof delay === 'undefined') {
      delay = getTotalDelay();
      autoplayDelayTotal = delay;
      autoplayDelayCurrent = delay;
    }
    autoplayTimeLeft = delay;
    const speed = swiper.params.speed;
    const proceed = () => {
      if (!swiper || swiper.destroyed) return;
      if (swiper.params.autoplay.reverseDirection) {
        if (!swiper.isBeginning || swiper.params.loop || swiper.params.rewind) {
          swiper.slidePrev(speed, true, true);
          emit('autoplay');
        } else if (!swiper.params.autoplay.stopOnLastSlide) {
          swiper.slideTo(swiper.slides.length - 1, speed, true, true);
          emit('autoplay');
        }
      } else {
        if (!swiper.isEnd || swiper.params.loop || swiper.params.rewind) {
          swiper.slideNext(speed, true, true);
          emit('autoplay');
        } else if (!swiper.params.autoplay.stopOnLastSlide) {
          swiper.slideTo(0, speed, true, true);
          emit('autoplay');
        }
      }
      if (swiper.params.cssMode) {
        autoplayStartTime = new Date().getTime();
        requestAnimationFrame(() => {
          run();
        });
      }
    };
    if (delay > 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        proceed();
      }, delay);
    } else {
      requestAnimationFrame(() => {
        proceed();
      });
    }

    // eslint-disable-next-line
    return delay;
  };
  const start = () => {
    autoplayStartTime = new Date().getTime();
    swiper.autoplay.running = true;
    run();
    emit('autoplayStart');
  };
  const stop = () => {
    swiper.autoplay.running = false;
    clearTimeout(timeout);
    cancelAnimationFrame(raf);
    emit('autoplayStop');
  };
  const pause = (internal, reset) => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    clearTimeout(timeout);
    if (!internal) {
      pausedByInteraction = true;
    }
    const proceed = () => {
      emit('autoplayPause');
      if (swiper.params.autoplay.waitForTransition) {
        swiper.wrapperEl.addEventListener('transitionend', onTransitionEnd);
      } else {
        resume();
      }
    };
    swiper.autoplay.paused = true;
    if (reset) {
      proceed();
      return;
    }
    const delay = autoplayTimeLeft || swiper.params.autoplay.delay;
    autoplayTimeLeft = delay - (new Date().getTime() - autoplayStartTime);
    if (swiper.isEnd && autoplayTimeLeft < 0 && !swiper.params.loop) return;
    if (autoplayTimeLeft < 0) autoplayTimeLeft = 0;
    proceed();
  };
  const resume = () => {
    if (swiper.isEnd && autoplayTimeLeft < 0 && !swiper.params.loop || swiper.destroyed || !swiper.autoplay.running) return;
    autoplayStartTime = new Date().getTime();
    if (pausedByInteraction) {
      pausedByInteraction = false;
      run(autoplayTimeLeft);
    } else {
      run();
    }
    swiper.autoplay.paused = false;
    emit('autoplayResume');
  };
  const onVisibilityChange = () => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    const document = getDocument();
    if (document.visibilityState === 'hidden') {
      pausedByInteraction = true;
      pause(true);
    }
    if (document.visibilityState === 'visible') {
      resume();
    }
  };
  const onPointerEnter = e => {
    if (e.pointerType !== 'mouse') return;
    pausedByInteraction = true;
    pausedByPointerEnter = true;
    if (swiper.animating || swiper.autoplay.paused) return;
    pause(true);
  };
  const onPointerLeave = e => {
    if (e.pointerType !== 'mouse') return;
    pausedByPointerEnter = false;
    if (swiper.autoplay.paused) {
      resume();
    }
  };
  const attachMouseEvents = () => {
    if (swiper.params.autoplay.pauseOnMouseEnter) {
      swiper.el.addEventListener('pointerenter', onPointerEnter);
      swiper.el.addEventListener('pointerleave', onPointerLeave);
    }
  };
  const detachMouseEvents = () => {
    if (swiper.el && typeof swiper.el !== 'string') {
      swiper.el.removeEventListener('pointerenter', onPointerEnter);
      swiper.el.removeEventListener('pointerleave', onPointerLeave);
    }
  };
  const attachDocumentEvents = () => {
    const document = getDocument();
    document.addEventListener('visibilitychange', onVisibilityChange);
  };
  const detachDocumentEvents = () => {
    const document = getDocument();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
  on('init', () => {
    if (swiper.params.autoplay.enabled) {
      attachMouseEvents();
      attachDocumentEvents();
      start();
    }
  });
  on('destroy', () => {
    detachMouseEvents();
    detachDocumentEvents();
    if (swiper.autoplay.running) {
      stop();
    }
  });
  on('_freeModeStaticRelease', () => {
    if (pausedByTouch || pausedByInteraction) {
      resume();
    }
  });
  on('_freeModeNoMomentumRelease', () => {
    if (!swiper.params.autoplay.disableOnInteraction) {
      pause(true, true);
    } else {
      stop();
    }
  });
  on('beforeTransitionStart', (_s, speed, internal) => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    if (internal || !swiper.params.autoplay.disableOnInteraction) {
      pause(true, true);
    } else {
      stop();
    }
  });
  on('sliderFirstMove', () => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    if (swiper.params.autoplay.disableOnInteraction) {
      stop();
      return;
    }
    isTouched = true;
    pausedByTouch = false;
    pausedByInteraction = false;
    touchStartTimeout = setTimeout(() => {
      pausedByInteraction = true;
      pausedByTouch = true;
      pause(true);
    }, 200);
  });
  on('touchEnd', () => {
    if (swiper.destroyed || !swiper.autoplay.running || !isTouched) return;
    clearTimeout(touchStartTimeout);
    clearTimeout(timeout);
    if (swiper.params.autoplay.disableOnInteraction) {
      pausedByTouch = false;
      isTouched = false;
      return;
    }
    if (pausedByTouch && swiper.params.cssMode) resume();
    pausedByTouch = false;
    isTouched = false;
  });
  on('slideChange', () => {
    if (swiper.destroyed || !swiper.autoplay.running) return;
    if (swiper.autoplay.paused) {
      autoplayTimeLeft = getTotalDelay();
      autoplayDelayTotal = getTotalDelay();
    }
  });
  Object.assign(swiper.autoplay, {
    start,
    stop,
    pause,
    resume
  });
}

function Thumb({
  swiper,
  extendParams,
  on
}) {
  extendParams({
    thumbs: {
      swiper: null,
      multipleActiveThumbs: true,
      autoScrollOffset: 0,
      slideThumbActiveClass: 'swiper-slide-thumb-active',
      thumbsContainerClass: 'swiper-thumbs'
    }
  });
  let initialized = false;
  let swiperCreated = false;
  swiper.thumbs = {
    swiper: null
  };
  function isVirtualEnabled() {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed) return false;
    return thumbsSwiper.params.virtual && thumbsSwiper.params.virtual.enabled;
  }
  function onThumbClick() {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
    const clickedIndex = thumbsSwiper.clickedIndex;
    const clickedSlide = thumbsSwiper.clickedSlide;
    if (clickedSlide && clickedSlide.classList.contains(swiper.params.thumbs.slideThumbActiveClass)) return;
    if (typeof clickedIndex === 'undefined' || clickedIndex === null) return;
    let slideToIndex;
    if (thumbsSwiper.params.loop) {
      slideToIndex = parseInt(thumbsSwiper.clickedSlide.getAttribute('data-swiper-slide-index'), 10);
    } else {
      slideToIndex = clickedIndex;
    }
    if (swiper.params.loop) {
      swiper.slideToLoop(slideToIndex);
    } else {
      swiper.slideTo(slideToIndex);
    }
  }
  function init() {
    const {
      thumbs: thumbsParams
    } = swiper.params;
    if (initialized) return false;
    initialized = true;
    const SwiperClass = swiper.constructor;
    if (thumbsParams.swiper instanceof SwiperClass) {
      if (thumbsParams.swiper.destroyed) {
        initialized = false;
        return false;
      }
      swiper.thumbs.swiper = thumbsParams.swiper;
      Object.assign(swiper.thumbs.swiper.originalParams, {
        watchSlidesProgress: true,
        slideToClickedSlide: false
      });
      Object.assign(swiper.thumbs.swiper.params, {
        watchSlidesProgress: true,
        slideToClickedSlide: false
      });
      swiper.thumbs.swiper.update();
    } else if (isObject(thumbsParams.swiper)) {
      const thumbsSwiperParams = Object.assign({}, thumbsParams.swiper);
      Object.assign(thumbsSwiperParams, {
        watchSlidesProgress: true,
        slideToClickedSlide: false
      });
      swiper.thumbs.swiper = new SwiperClass(thumbsSwiperParams);
      swiperCreated = true;
    }
    swiper.thumbs.swiper.el.classList.add(swiper.params.thumbs.thumbsContainerClass);
    swiper.thumbs.swiper.on('tap', onThumbClick);
    if (isVirtualEnabled()) {
      swiper.thumbs.swiper.on('virtualUpdate', () => {
        update(false, {
          autoScroll: false
        });
      });
    }
    return true;
  }
  function update(initial, p) {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;

    // Activate thumbs
    let thumbsToActivate = 1;
    const thumbActiveClass = swiper.params.thumbs.slideThumbActiveClass;
    if (swiper.params.slidesPerView > 1 && !swiper.params.centeredSlides) {
      thumbsToActivate = swiper.params.slidesPerView;
    }
    if (!swiper.params.thumbs.multipleActiveThumbs) {
      thumbsToActivate = 1;
    }
    thumbsToActivate = Math.floor(thumbsToActivate);
    thumbsSwiper.slides.forEach(slideEl => slideEl.classList.remove(thumbActiveClass));
    if (thumbsSwiper.params.loop || isVirtualEnabled()) {
      for (let i = 0; i < thumbsToActivate; i += 1) {
        elementChildren(thumbsSwiper.slidesEl, `[data-swiper-slide-index="${swiper.realIndex + i}"]`).forEach(slideEl => {
          slideEl.classList.add(thumbActiveClass);
        });
      }
    } else {
      for (let i = 0; i < thumbsToActivate; i += 1) {
        if (thumbsSwiper.slides[swiper.realIndex + i]) {
          thumbsSwiper.slides[swiper.realIndex + i].classList.add(thumbActiveClass);
        }
      }
    }
    if (p?.autoScroll ?? true) {
      autoScroll(initial ? 0 : undefined);
    }
  }
  function autoScroll(slideSpeed) {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
    const slidesPerView = thumbsSwiper.params.slidesPerView === 'auto' ? thumbsSwiper.slidesPerViewDynamic() : thumbsSwiper.params.slidesPerView;
    const autoScrollOffset = swiper.params.thumbs.autoScrollOffset;
    const useOffset = autoScrollOffset && !thumbsSwiper.params.loop;
    if (swiper.realIndex !== thumbsSwiper.realIndex || useOffset) {
      const currentThumbsIndex = thumbsSwiper.activeIndex;
      let newThumbsIndex;
      let direction;
      if (thumbsSwiper.params.loop) {
        const newThumbsSlide = thumbsSwiper.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') === `${swiper.realIndex}`);
        newThumbsIndex = thumbsSwiper.slides.indexOf(newThumbsSlide);
        direction = swiper.activeIndex > swiper.previousIndex ? 'next' : 'prev';
      } else {
        newThumbsIndex = swiper.realIndex;
        direction = newThumbsIndex > swiper.previousIndex ? 'next' : 'prev';
      }
      if (useOffset) {
        newThumbsIndex += direction === 'next' ? autoScrollOffset : -1 * autoScrollOffset;
      }
      if (thumbsSwiper.visibleSlidesIndexes && thumbsSwiper.visibleSlidesIndexes.indexOf(newThumbsIndex) < 0) {
        if (thumbsSwiper.params.centeredSlides) {
          if (newThumbsIndex > currentThumbsIndex) {
            newThumbsIndex = newThumbsIndex - Math.floor(slidesPerView / 2) + 1;
          } else {
            newThumbsIndex = newThumbsIndex + Math.floor(slidesPerView / 2) - 1;
          }
        } else if (newThumbsIndex > currentThumbsIndex && thumbsSwiper.params.slidesPerGroup === 1) ;
        thumbsSwiper.slideTo(newThumbsIndex, slideSpeed);
      }
    }
  }
  on('beforeInit', () => {
    const {
      thumbs
    } = swiper.params;
    if (!thumbs || !thumbs.swiper) return;
    if (typeof thumbs.swiper === 'string' || thumbs.swiper instanceof HTMLElement) {
      const document = getDocument();
      const getThumbsElementAndInit = () => {
        const thumbsElement = typeof thumbs.swiper === 'string' ? document.querySelector(thumbs.swiper) : thumbs.swiper;
        if (thumbsElement && thumbsElement.swiper) {
          thumbs.swiper = thumbsElement.swiper;
          init();
          update(true);
        } else if (thumbsElement) {
          const eventName = `${swiper.params.eventsPrefix}init`;
          const onThumbsSwiper = e => {
            thumbs.swiper = e.detail[0];
            thumbsElement.removeEventListener(eventName, onThumbsSwiper);
            init();
            update(true);
            thumbs.swiper.update();
            swiper.update();
          };
          thumbsElement.addEventListener(eventName, onThumbsSwiper);
        }
        return thumbsElement;
      };
      const watchForThumbsToAppear = () => {
        if (swiper.destroyed) return;
        const thumbsElement = getThumbsElementAndInit();
        if (!thumbsElement) {
          requestAnimationFrame(watchForThumbsToAppear);
        }
      };
      requestAnimationFrame(watchForThumbsToAppear);
    } else {
      init();
      update(true);
    }
  });
  on('slideChange update resize observerUpdate', () => {
    update();
  });
  on('setTransition', (_s, duration) => {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
    thumbsSwiper.setTransition(duration);
  });
  on('beforeDestroy', () => {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed) return;
    if (swiperCreated) {
      thumbsSwiper.destroy();
    }
  });
  Object.assign(swiper.thumbs, {
    init,
    update
  });
}

function freeMode({
  swiper,
  extendParams,
  emit,
  once
}) {
  extendParams({
    freeMode: {
      enabled: false,
      momentum: true,
      momentumRatio: 1,
      momentumBounce: true,
      momentumBounceRatio: 1,
      momentumVelocityRatio: 1,
      sticky: false,
      minimumVelocity: 0.02
    }
  });
  function onTouchStart() {
    if (swiper.params.cssMode) return;
    const translate = swiper.getTranslate();
    swiper.setTranslate(translate);
    swiper.setTransition(0);
    swiper.touchEventsData.velocities.length = 0;
    swiper.freeMode.onTouchEnd({
      currentPos: swiper.rtl ? swiper.translate : -swiper.translate
    });
  }
  function onTouchMove() {
    if (swiper.params.cssMode) return;
    const {
      touchEventsData: data,
      touches
    } = swiper;
    // Velocity
    if (data.velocities.length === 0) {
      data.velocities.push({
        position: touches[swiper.isHorizontal() ? 'startX' : 'startY'],
        time: data.touchStartTime
      });
    }
    data.velocities.push({
      position: touches[swiper.isHorizontal() ? 'currentX' : 'currentY'],
      time: now()
    });
  }
  function onTouchEnd({
    currentPos
  }) {
    if (swiper.params.cssMode) return;
    const {
      params,
      wrapperEl,
      rtlTranslate: rtl,
      snapGrid,
      touchEventsData: data
    } = swiper;
    // Time diff
    const touchEndTime = now();
    const timeDiff = touchEndTime - data.touchStartTime;
    if (currentPos < -swiper.minTranslate()) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    if (currentPos > -swiper.maxTranslate()) {
      if (swiper.slides.length < snapGrid.length) {
        swiper.slideTo(snapGrid.length - 1);
      } else {
        swiper.slideTo(swiper.slides.length - 1);
      }
      return;
    }
    if (params.freeMode.momentum) {
      if (data.velocities.length > 1) {
        const lastMoveEvent = data.velocities.pop();
        const velocityEvent = data.velocities.pop();
        const distance = lastMoveEvent.position - velocityEvent.position;
        const time = lastMoveEvent.time - velocityEvent.time;
        swiper.velocity = distance / time;
        swiper.velocity /= 2;
        if (Math.abs(swiper.velocity) < params.freeMode.minimumVelocity) {
          swiper.velocity = 0;
        }
        // this implies that the user stopped moving a finger then released.
        // There would be no events with distance zero, so the last event is stale.
        if (time > 150 || now() - lastMoveEvent.time > 300) {
          swiper.velocity = 0;
        }
      } else {
        swiper.velocity = 0;
      }
      swiper.velocity *= params.freeMode.momentumVelocityRatio;
      data.velocities.length = 0;
      let momentumDuration = 1000 * params.freeMode.momentumRatio;
      const momentumDistance = swiper.velocity * momentumDuration;
      let newPosition = swiper.translate + momentumDistance;
      if (rtl) newPosition = -newPosition;
      let doBounce = false;
      let afterBouncePosition;
      const bounceAmount = Math.abs(swiper.velocity) * 20 * params.freeMode.momentumBounceRatio;
      let needsLoopFix;
      if (newPosition < swiper.maxTranslate()) {
        if (params.freeMode.momentumBounce) {
          if (newPosition + swiper.maxTranslate() < -bounceAmount) {
            newPosition = swiper.maxTranslate() - bounceAmount;
          }
          afterBouncePosition = swiper.maxTranslate();
          doBounce = true;
          data.allowMomentumBounce = true;
        } else {
          newPosition = swiper.maxTranslate();
        }
        if (params.loop && params.centeredSlides) needsLoopFix = true;
      } else if (newPosition > swiper.minTranslate()) {
        if (params.freeMode.momentumBounce) {
          if (newPosition - swiper.minTranslate() > bounceAmount) {
            newPosition = swiper.minTranslate() + bounceAmount;
          }
          afterBouncePosition = swiper.minTranslate();
          doBounce = true;
          data.allowMomentumBounce = true;
        } else {
          newPosition = swiper.minTranslate();
        }
        if (params.loop && params.centeredSlides) needsLoopFix = true;
      } else if (params.freeMode.sticky) {
        let nextSlide;
        for (let j = 0; j < snapGrid.length; j += 1) {
          if (snapGrid[j] > -newPosition) {
            nextSlide = j;
            break;
          }
        }
        if (Math.abs(snapGrid[nextSlide] - newPosition) < Math.abs(snapGrid[nextSlide - 1] - newPosition) || swiper.swipeDirection === 'next') {
          newPosition = snapGrid[nextSlide];
        } else {
          newPosition = snapGrid[nextSlide - 1];
        }
        newPosition = -newPosition;
      }
      if (needsLoopFix) {
        once('transitionEnd', () => {
          swiper.loopFix();
        });
      }
      // Fix duration
      if (swiper.velocity !== 0) {
        if (rtl) {
          momentumDuration = Math.abs((-newPosition - swiper.translate) / swiper.velocity);
        } else {
          momentumDuration = Math.abs((newPosition - swiper.translate) / swiper.velocity);
        }
        if (params.freeMode.sticky) {
          // If freeMode.sticky is active and the user ends a swipe with a slow-velocity
          // event, then durations can be 20+ seconds to slide one (or zero!) slides.
          // It's easy to see this when simulating touch with mouse events. To fix this,
          // limit single-slide swipes to the default slide duration. This also has the
          // nice side effect of matching slide speed if the user stopped moving before
          // lifting finger or mouse vs. moving slowly before lifting the finger/mouse.
          // For faster swipes, also apply limits (albeit higher ones).
          const moveDistance = Math.abs((rtl ? -newPosition : newPosition) - swiper.translate);
          const currentSlideSize = swiper.slidesSizesGrid[swiper.activeIndex];
          if (moveDistance < currentSlideSize) {
            momentumDuration = params.speed;
          } else if (moveDistance < 2 * currentSlideSize) {
            momentumDuration = params.speed * 1.5;
          } else {
            momentumDuration = params.speed * 2.5;
          }
        }
      } else if (params.freeMode.sticky) {
        swiper.slideToClosest();
        return;
      }
      if (params.freeMode.momentumBounce && doBounce) {
        swiper.updateProgress(afterBouncePosition);
        swiper.setTransition(momentumDuration);
        swiper.setTranslate(newPosition);
        swiper.transitionStart(true, swiper.swipeDirection);
        swiper.animating = true;
        elementTransitionEnd(wrapperEl, () => {
          if (!swiper || swiper.destroyed || !data.allowMomentumBounce) return;
          emit('momentumBounce');
          swiper.setTransition(params.speed);
          setTimeout(() => {
            swiper.setTranslate(afterBouncePosition);
            elementTransitionEnd(wrapperEl, () => {
              if (!swiper || swiper.destroyed) return;
              swiper.transitionEnd();
            });
          }, 0);
        });
      } else if (swiper.velocity) {
        emit('_freeModeNoMomentumRelease');
        swiper.updateProgress(newPosition);
        swiper.setTransition(momentumDuration);
        swiper.setTranslate(newPosition);
        swiper.transitionStart(true, swiper.swipeDirection);
        if (!swiper.animating) {
          swiper.animating = true;
          elementTransitionEnd(wrapperEl, () => {
            if (!swiper || swiper.destroyed) return;
            swiper.transitionEnd();
          });
        }
      } else {
        swiper.updateProgress(newPosition);
      }
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    } else if (params.freeMode.sticky) {
      swiper.slideToClosest();
      return;
    } else if (params.freeMode) {
      emit('_freeModeNoMomentumRelease');
    }
    if (!params.freeMode.momentum || timeDiff >= params.longSwipesMs) {
      emit('_freeModeStaticRelease');
      swiper.updateProgress();
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    }
  }
  Object.assign(swiper, {
    freeMode: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  });
}

function effectInit(params) {
  const {
    effect,
    swiper,
    on,
    setTranslate,
    setTransition,
    overwriteParams,
    perspective,
    recreateShadows,
    getEffectParams
  } = params;
  on('beforeInit', () => {
    if (swiper.params.effect !== effect) return;
    swiper.classNames.push(`${swiper.params.containerModifierClass}${effect}`);
    if (perspective && perspective()) {
      swiper.classNames.push(`${swiper.params.containerModifierClass}3d`);
    }
    const overwriteParamsResult = overwriteParams ? overwriteParams() : {};
    Object.assign(swiper.params, overwriteParamsResult);
    Object.assign(swiper.originalParams, overwriteParamsResult);
  });
  on('setTranslate _virtualUpdated', () => {
    if (swiper.params.effect !== effect) return;
    setTranslate();
  });
  on('setTransition', (_s, duration) => {
    if (swiper.params.effect !== effect) return;
    setTransition(duration);
  });
  on('transitionEnd', () => {
    if (swiper.params.effect !== effect) return;
    if (recreateShadows) {
      if (!getEffectParams || !getEffectParams().slideShadows) return;
      // remove shadows
      swiper.slides.forEach(slideEl => {
        slideEl.querySelectorAll('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').forEach(shadowEl => shadowEl.remove());
      });
      // create new one
      recreateShadows();
    }
  });
  let requireUpdateOnVirtual;
  on('virtualUpdate', () => {
    if (swiper.params.effect !== effect) return;
    if (!swiper.slides.length) {
      requireUpdateOnVirtual = true;
    }
    requestAnimationFrame(() => {
      if (requireUpdateOnVirtual && swiper.slides && swiper.slides.length) {
        setTranslate();
        requireUpdateOnVirtual = false;
      }
    });
  });
}

function effectTarget(effectParams, slideEl) {
  const transformEl = getSlideTransformEl(slideEl);
  if (transformEl !== slideEl) {
    transformEl.style.backfaceVisibility = 'hidden';
    transformEl.style['-webkit-backface-visibility'] = 'hidden';
  }
  return transformEl;
}

function effectVirtualTransitionEnd({
  swiper,
  duration,
  transformElements,
  allSlides
}) {
  const {
    activeIndex
  } = swiper;
  if (swiper.params.virtualTranslate && duration !== 0) {
    let eventTriggered = false;
    let transitionEndTarget;
    {
      transitionEndTarget = transformElements;
    }
    transitionEndTarget.forEach(el => {
      elementTransitionEnd(el, () => {
        if (eventTriggered) return;
        if (!swiper || swiper.destroyed) return;
        eventTriggered = true;
        swiper.animating = false;
        const evt = new window.CustomEvent('transitionend', {
          bubbles: true,
          cancelable: true
        });
        swiper.wrapperEl.dispatchEvent(evt);
      });
    });
  }
}

function EffectFade({
  swiper,
  extendParams,
  on
}) {
  extendParams({
    fadeEffect: {
      crossFade: false
    }
  });
  const setTranslate = () => {
    const {
      slides
    } = swiper;
    const params = swiper.params.fadeEffect;
    for (let i = 0; i < slides.length; i += 1) {
      const slideEl = swiper.slides[i];
      const offset = slideEl.swiperSlideOffset;
      let tx = -offset;
      if (!swiper.params.virtualTranslate) tx -= swiper.translate;
      let ty = 0;
      if (!swiper.isHorizontal()) {
        ty = tx;
        tx = 0;
      }
      const slideOpacity = swiper.params.fadeEffect.crossFade ? Math.max(1 - Math.abs(slideEl.progress), 0) : 1 + Math.min(Math.max(slideEl.progress, -1), 0);
      const targetEl = effectTarget(params, slideEl);
      targetEl.style.opacity = slideOpacity;
      targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`;
    }
  };
  const setTransition = duration => {
    const transformElements = swiper.slides.map(slideEl => getSlideTransformEl(slideEl));
    transformElements.forEach(el => {
      el.style.transitionDuration = `${duration}ms`;
    });
    effectVirtualTransitionEnd({
      swiper,
      duration,
      transformElements,
      allSlides: true
    });
  };
  effectInit({
    effect: 'fade',
    swiper,
    on,
    setTranslate,
    setTransition,
    overwriteParams: () => ({
      slidesPerView: 1,
      slidesPerGroup: 1,
      watchSlidesProgress: true,
      spaceBetween: 0,
      virtualTranslate: !swiper.params.cssMode
    })
  });
}

/*
	Swiper
	https://swiperjs.com/swiper-api
*/

function initSwiper() {

    const homeSlider = document.querySelector('.js-home-swiper:not(.swiper-initialized)');

    if (homeSlider) {

        new Swiper('.js-home-swiper:not(.swiper-initialized)', {
            modules: [Keyboard, Navigation, Pagination, EffectFade, Autoplay ],
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            // effect: 'fade',
            // fadeEffect: {
            //     crossFade: true
            // },
            speed: 800,
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            navigation: {
              prevEl: '.js-home-swiper-prev',
              nextEl: '.js-home-swiper-next',
            },
            pagination: {
                el: '.js-home-swiper-pagination',
                type: 'bullets',
                clickable: true,
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
        });
    }

    if (document.querySelector('.js-benefits-swiper:not(.swiper-initialized)')) {
        let benefitsSwiperInstance;

        const benefitsSwiperInit = () => {
            if (window.innerWidth < 768 && !benefitsSwiperInstance) {
                benefitsSwiperInstance = new Swiper('.js-benefits-swiper:not(.swiper-initialized)', {
                    modules: [freeMode, Scrollbar],
                    slidesPerView: 'auto',
                    spaceBetween: 12,
                    freeMode: {
                        enabled: true,
                    },
                     scrollbar: {
                        el: '.js-benefits-swiper-scrollbar',
                        draggable: true,
                          snapOnRelease: false,
                    },
                });
            } else if (window.innerWidth >= 768 && benefitsSwiperInstance) {
                benefitsSwiperInstance.destroy(true, true);
                benefitsSwiperInstance = null;
            }
        };

        benefitsSwiperInit();

        window.addEventListener('resize', benefitsSwiperInit);
    }

    if (document.querySelector('.js-categories-swiper:not(.swiper-initialized)')) {
        let categoriesSwiperInstance;

        const categoriesSwiperInit = () => {
            if (window.innerWidth < 768 && !categoriesSwiperInstance) {
                categoriesSwiperInstance = new Swiper('.js-categories-swiper:not(.swiper-initialized)', {
                    modules: [freeMode, Scrollbar],
                    slidesPerView: 'auto',
                    spaceBetween: 12,
                    freeMode: {
                        enabled: true,
                    },
                     scrollbar: {
                        el: '.js-categories-swiper-scrollbar',
                        draggable: true,
                        snapOnRelease: false,
                    },
                });
            } else if (window.innerWidth >= 768 && categoriesSwiperInstance) {
                categoriesSwiperInstance.destroy(true, true);
                categoriesSwiperInstance = null;
            }
        };

        categoriesSwiperInit();

        window.addEventListener('resize', categoriesSwiperInit);
    }

    if (document.querySelector('.js-featured-categories-swiper:not(.swiper-initialized)')) {

        const categoriesSwiperInit = () => {
            new Swiper('.js-featured-categories-swiper:not(.swiper-initialized)', {
                modules: [freeMode, Scrollbar, Navigation, Mousewheel],
                slidesPerView: 'auto',
                spaceBetween: 12,
                freeMode: {
                    enabled: true,
                },
                 mousewheel: {
                    forceToAxis: true,
                    enabled: true,
                },
                scrollbar: {
                    el: '.js-featured-categories-swiper-scrollbar',
                    draggable: true,
                    snapOnRelease: false,
                },
                 navigation: {
                  prevEl: '.js-featured-categories-swiper-prev',
                  nextEl: '.js-featured-categories-swiper-next',
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        slidesPerGroup: 2,
                        spaceBetween: 12,

                    },
                    1200: {
                        slidesPerView: 3,
                        slidesPerGroup: 3,
                        spaceBetween: 18,
                    },
                }
            });
        };

        categoriesSwiperInit();
    }

     if (document.querySelector('.js-found-categories-swiper:not(.swiper-initialized)')) {
        let categoriesSwiperInstance;

        const categoriesSwiperInit = () => {
            if (window.innerWidth < 1025 && !categoriesSwiperInstance) {
                categoriesSwiperInstance = new Swiper('.js-found-categories-swiper:not(.swiper-initialized)', {
                    modules: [freeMode],
                    slidesPerView: 'auto',
                    spaceBetween: 12,
                    freeMode: {
                        enabled: true,
                    },
                    //  scrollbar: {
                    //     el: '.js-categories-swiper-scrollbar',
                    //     draggable: true,
                    //     snapOnRelease: false,
                    // },
                    breakpoints: {
                        768: {
                             slidesPerView: 3,
                            slidesPerGroup: 3,
                            spaceBetween: 18,
                        },
                        992: {
                             slidesPerView: 4,
                            slidesPerGroup: 4,
                            spaceBetween: 18,
                        },
                    }
                });
            } else if (window.innerWidth >= 1025 && categoriesSwiperInstance) {
                categoriesSwiperInstance.destroy(true, true);
                categoriesSwiperInstance = null;
            }
        };

        categoriesSwiperInit();

        window.addEventListener('resize', categoriesSwiperInit);
    }

    const productsSwiperElements = document.querySelectorAll('.js-products-swiper:not(.swiper-initialized)');

    if (productsSwiperElements?.length) {
        productsSwiperElements.forEach(swiperEl => {
            new Swiper(swiperEl, {
                modules: [Keyboard, Navigation, freeMode, Scrollbar, Mousewheel],
                keyboard: {
                    enabled: true,
                    onlyInViewport: true,
                },
                grabCursor: true,
                freeMode: true,
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 12,
                loop: false,
                speed: 600,
                navigation: {
                  prevEl: '.js-products-swiper-prev',
                  nextEl: '.js-products-swiper-next',
                },
                  mousewheel: {
                    forceToAxis: true,
                    enabled: true,
                },
                scrollbar: {
                    el: '.js-products-swiper-scrollbar',
                    draggable: true,
                    snapOnRelease: false,
                },
                breakpoints: {
                    576: {
                        slidesPerView: 3,
                        slidesPerGroup: 3,
                        spaceBetween: 16,

                    },
                    // 768: {
                    //     slidesPerView: 3,
                    //     slidesPerGroup: 3,
                    // },
                    1025: {
                        slidesPerView: 3,
                        slidesPerGroup: 3,
                    spaceBetween: 18,

                    },
                    1200: {
                        slidesPerView: 4,
                        slidesPerGroup: 4,
                spaceBetween: 18,

                    },
                },
                on: {
                    init: function (swiper) {
                        const swiperSection = swiper.el.closest('.js-products-swiper-section');

                        if (swiperSection) {
                            if (swiper.isLocked) {
                                swiperSection.classList.remove('is-swiper-items');
                            } else {
                                swiperSection.classList.add('is-swiper-items');
                            }
                        }
                    },
                    resize: function (swiper) {
                        const swiperSection = swiper.el.closest('.js-products-swiper-section');

                        if (swiperSection) {
                            if (swiper.isLocked) {
                                swiperSection.classList.remove('is-swiper-items');
                            } else {
                                swiperSection.classList.add('is-swiper-items');
                            }
                        }
                    },
                },
            });

        });
    }


    new Swiper('.js-promotions-swiper:not(.swiper-initialized)', {
        modules: [Keyboard, Navigation, freeMode, Scrollbar, Mousewheel],
        keyboard: {
            enabled: true,
            onlyInViewport: true,
        },
        speed: 600,

        grabCursor: true,
       freeMode: true,
        mousewheel: {
            forceToAxis: true,
            enabled: true,
        },
        scrollbar: {
            el: '.js-promotions-swiper-scrollbar',
            draggable: true,
            snapOnRelease: false,
        },
        slidesPerView: 2,
        slidesPerGroup: 2,
        spaceBetween: 12,
        loop: false,
        navigation: {
          prevEl: '.js-promotions-swiper-prev',
          nextEl: '.js-promotions-swiper-next',
        },
        breakpoints: {
            576: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 16,
            },
             768: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 16,
            },
             1025: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 18,
            },
            1200: {
                slidesPerView: 4,
                slidesPerGroup: 4,
                spaceBetween: 18,

            },
        },
        on: {
            init: function (swiper) {
                const swiperSection = swiper.el.closest('.js-promotions-swiper-section');

                if (swiperSection) {
                    if (swiper.isLocked) {
                        swiperSection.classList.remove('is-swiper-items');
                    } else {
                        swiperSection.classList.add('is-swiper-items');
                    }
                }
            },
            resize: function (swiper) {
                const swiperSection = swiper.el.closest('.js-promotions-swiper-section');

                if (swiperSection) {
                    if (swiper.isLocked) {
                        swiperSection.classList.remove('is-swiper-items');
                    } else {
                        swiperSection.classList.add('is-swiper-items');
                    }
                }
            },
        },
    });


    new Swiper('.js-articles-swiper:not(.swiper-initialized)', {
        modules: [Keyboard, Navigation, freeMode, Scrollbar, Mousewheel],
        keyboard: {
            enabled: true,
            onlyInViewport: true,
        },
        speed: 600,
        grabCursor: true,
        freeMode: {
            enabled: true,
            sticky: false,
             momentum: true,
        },
        mousewheel: {
            forceToAxis: true,
            enabled: true,
        },
        slidesPerView: 'auto',
        slidesPerGroup: 1,
        spaceBetween: 12,
        loop: false,
        navigation: {
          prevEl: '.js-articles-swiper-prev',
          nextEl: '.js-articles-swiper-next',
        },
        breakpoints: {
            576: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 16,
            },
            992: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 16,
            },
            1025: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 18,
            },
        },
        scrollbar: {
            el: '.js-articles-swiper-scrollbar',
            draggable: true,
            snapOnRelease: false,
        },
        on: {
            init: function (swiper) {
                const swiperSection = swiper.el.closest('.js-articles-swiper-section');

                if (swiperSection) {
                    if (swiper.isLocked) {
                        swiperSection.classList.remove('is-swiper-items');
                    } else {
                        swiperSection.classList.add('is-swiper-items');
                    }
                }
            },
            resize: function (swiper) {
                const swiperSection = swiper.el.closest('.js-articles-swiper-section');

                if (swiperSection) {
                    if (swiper.isLocked) {
                        swiperSection.classList.remove('is-swiper-items');
                    } else {
                        swiperSection.classList.add('is-swiper-items');
                    }
                }
            },
        },
    });

    new Swiper('.js-gallery-swiper:not(.swiper-initialized)', {
        modules: [Keyboard, Navigation, freeMode, Scrollbar, Mousewheel],
        keyboard: {
            enabled: true,
            onlyInViewport: true,
        },
        speed: 600,

        grabCursor: true,
        freeMode: {
            enabled: true,
            sticky: false,
             momentum: true,
        },
        mousewheel: {
            forceToAxis: true,
            enabled: true,
        },
        slidesPerView: 'auto',
        slidesPerGroup: 1,

        spaceBetween: 12,
        loop: false,
        navigation: {
          prevEl: '.js-gallery-swiper-prev',
          nextEl: '.js-gallery-swiper-next',
        },
        breakpoints: {
            576: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 16,
            },
            992: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 16,
            },
            1025: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 18,
            },
        },
         scrollbar: {
            el: '.js-gallery-swiper-scrollbar',
            draggable: true,
            snapOnRelease: false,
        },
        on: {
            init: function (swiper) {
                const swiperSection = swiper.el.closest('.js-gallery-swiper-section');

                if (swiperSection) {
                    if (swiper.isLocked) {
                        swiperSection.classList.remove('is-swiper-items');
                    } else {
                        swiperSection.classList.add('is-swiper-items');
                    }
                }
            },
            resize: function (swiper) {
                const swiperSection = swiper.el.closest('.js-gallery-swiper-section');

                if (swiperSection) {
                    if (swiper.isLocked) {
                        swiperSection.classList.remove('is-swiper-items');
                    } else {
                        swiperSection.classList.add('is-swiper-items');
                    }
                }
            },
        },
    });

    const productSliders = document.querySelectorAll('.js-product-slider');

    if (productSliders.length) {
        productSliders.forEach((productSliderEl) => {
            const productSliderSwiperEl = productSliderEl.querySelector('.js-product-slider-swiper:not(.swiper-initialized)');
            const productThumbsSwiperEl = productSliderEl.querySelector('.js-product-slider-thumbs');

            if (productSliderSwiperEl) {
                let productThumbsSwiper;

                if (productThumbsSwiperEl) {
                    const direction = productThumbsSwiperEl.getAttribute('data-direction') || 'vertical';
                    productThumbsSwiper = new Swiper(productThumbsSwiperEl, {
                        direction: 'horizontal',
                        modules: [Navigation, Thumb, Mousewheel],
                        speed: 300,
                        slidesPerView: 3,
                        spaceBetween: 12,
                        mousewheel: true,
                        loop: false,
                        navigation: {
                            prevEl: '.js-product-slider-thumbs-prev',
                            nextEl: '.js-product-slider-thumbs-next',
                        },
                        breakpoints: {
                            576: {
                                slidesPerView: 4,
                                direction: 'horizontal',
                                spaceBetween: 12,
                            },
                            768: {
                                slidesPerView: 'auto',
                                spaceBetween: 10,

                                direction: direction,
                            },
                            1025: {
                                slidesPerView: 'auto',
                                slidesPerGroup: 'auto',
                                direction: direction,
                                spaceBetween: 12,

                            }
                        },
                    });

                    productThumbsSwiperEl.addEventListener('click', (event) => {
                        const {target} = event;

                        const swiperSlideVisible = target.closest('.swiper-slide-visible');
                        const prevSlide = swiperSlideVisible?.previousElementSibling;
                        const nextSlide = swiperSlideVisible?.nextElementSibling;

                        if (swiperSlideVisible) {
                            if (prevSlide && !prevSlide.classList.contains('swiper-slide-visible')) {

                                productThumbsSwiper.slidePrev();
                            }

                            if (nextSlide && !nextSlide.classList.contains('swiper-slide-visible')) {

                                productThumbsSwiper.slideNext();

                                if (window.innerWidth >= 575 && window.innerWidth <= 767) {
                                    productThumbsSwiper.slideNext();

                                }
                            }
                        }
                    });
                }

                new Swiper(productSliderSwiperEl, {
                    modules: [Navigation, Thumb],
                    // effect: 'fade',
                    // fadeEffect: {
                    //     crossFade: true
                    // },
                    speed: 300,
                    slidesPerView: 1,
                    spaceBetween: 22,
                    loop: false,
                    navigation: {
                        prevEl: '.js-product-slider-prev',
                        nextEl: '.js-product-slider-next',
                    },
                    thumbs: {
                        swiper: productThumbsSwiper || null,
                    },
                    on: {
                        init: function (swiper) {
                            // preloadNext(swiper, 0);
                        },
                        slideChange: function (swiper) {
                            // preloadNext(swiper, 0);
                        },
                      },
                });
            }
        });
    }

    if (document.querySelector('.js-catalog-gallery-swiper:not(.swiper-initialized)')) {
        let catalogGallerySwiperInstance;

        const catalogGallerySwiperInit = () => {
            if (window.innerWidth < 1024 && !catalogGallerySwiperInstance) {
                catalogGallerySwiperInstance = new Swiper('.js-catalog-gallery-swiper:not(.swiper-initialized)', {
                    modules: [freeMode, Scrollbar],
                    slidesPerView: 'auto',
                    spaceBetween: 12,
                    freeMode: {
                        enabled: true,
                    },
                    scrollbar: {
                        el: '.js-catalog-gallery-swiper-scrollbar',
                        draggable: true,
                        snapOnRelease: false,
                    },
                    breakpoints: {
                        768: {
                            slidesPerView: 2,
                            slidesPerGroup: 2,
                        },
                    },
                });
            } else if (window.innerWidth >= 1025 && catalogGallerySwiperInstance) {
                catalogGallerySwiperInstance.destroy(true, true);
                catalogGallerySwiperInstance = null;
            }
        };

        catalogGallerySwiperInit();

        window.addEventListener('resize', catalogGallerySwiperInit);
    }
}

class StickyElement {
  constructor(container) {
    this.container = container;
    this.sticky = container.querySelector('.sticky-element');

    if (!this.sticky) return;

    this.topOffset = parseInt(container.dataset.topOffset) || 20;
    this.bottomOffset = parseInt(container.dataset.bottomOffset) || 20;

    this.stickyStyles = {};
    this.lastScroll = 0;
    this.stickyTop = 0;
    this.containerTop = 0;
    this.containerHeight = 0;
    this.stickyHeight = 0;
    this.stickyWidth = 0;
    this.containerWidth = 0;
    this.isShortSticky = false;
    this.prevStickyOffset = 0;
    this.prevPosition = null;
    this.updateTimeout = null;

    // Bind methods
    this.onScroll = this.onScroll.bind(this);
    this.updatePosition = this.updatePosition.bind(this);
    this.updateWidth = this.updateWidth.bind(this);
    this.forceUpdateWidth = this.forceUpdateWidth.bind(this);

    this.init();
  }

  init() {
    // Обновляем позицию и ширину сразу
    this.updatePosition();
    this.forceUpdateWidth();

    // Добавляем слушатели событий
    window.addEventListener('scroll', this.onScroll, { passive: true });

    // Наблюдаем за изменениями размеров контейнера (это главное!)
    this.containerObserver = new ResizeObserver((entries) => {
      // При изменении размера контейнера обновляем ширину
      this.forceUpdateWidth();
      this.updatePosition();
    });

    if (this.container) {
      this.containerObserver.observe(this.container);
    }

    // Наблюдаем за самим sticky на случай изменения его размеров
    this.stickyObserver = new ResizeObserver(() => {
      this.forceUpdateWidth();
    });

    if (this.sticky) {
      this.stickyObserver.observe(this.sticky);
    }

    // Добавляем этот экземпляр в глобальный массив
    if (!window.__stickyInstances) {
      window.__stickyInstances = [];
    }
    window.__stickyInstances.push(this);

     document.addEventListener('sticky:refresh', () => {
      this.handleUpdate();
    });
  }

    handleUpdate() {
        if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.forceUpdateWidth();
            this.updatePosition();
            this.onScroll();
            this.updateTimeout = null;
        }, 10);
    }


  destroy() {
    window.removeEventListener('scroll', this.onScroll);

    if (this.containerObserver) {
      this.containerObserver.disconnect();
    }

    if (this.stickyObserver) {
      this.stickyObserver.disconnect();
    }

    // Удаляем из глобального массива
    if (window.__stickyInstances) {
      const index = window.__stickyInstances.indexOf(this);
      if (index > -1) {
        window.__stickyInstances.splice(index, 1);
      }
    }
  }

  forceUpdateWidth() {
    // Немедленное обновление
    this.updateWidth();
  }

  updateWidth() {
    if (!this.container || !this.sticky) return;

    // ПОЛУЧАЕМ ШИРИНУ КОНТЕЙНЕРА, А НЕ STICKY!
    const containerWidth = this.container.offsetWidth ||
                        this.container.clientWidth ||
                        this.container.getBoundingClientRect().width;

    const roundedContainerWidth = Math.round(containerWidth);

    // Сохраняем ширину контейнера
    if (roundedContainerWidth > 0) {
      this.containerWidth = roundedContainerWidth;

      // Устанавливаем CSS переменную на sticky элемент с шириной контейнера
      // Это позволяет sticky элементу знать ширину своего контейнера
      this.sticky.style.setProperty('--sticky-width', `${roundedContainerWidth}px`);

      // Также сохраняем ширину самого sticky для других нужд
      const stickyWidth = this.sticky.offsetWidth ||
                         this.sticky.clientWidth ||
                         this.sticky.getBoundingClientRect().width;
      this.stickyWidth = Math.round(stickyWidth);
    }
  }

  updatePosition() {
    if (!this.container || !this.sticky) return;

    const scrollTop = Math.round(window.scrollY || window.pageYOffset);
    const containerRect = this.container.getBoundingClientRect();
    const stickyRect = this.sticky.getBoundingClientRect();

    this.containerTop = Math.ceil(containerRect.top) + scrollTop;
    this.containerHeight = Math.ceil(this.container.offsetHeight);
    this.stickyHeight = Math.ceil(this.sticky.offsetHeight);
    this.stickyTop = Math.ceil(stickyRect.top) + scrollTop;

    // this.onScroll();
  }

  onScroll() {
    if (!this.sticky || !this.container) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const stickyRect = this.sticky.getBoundingClientRect();

    const startSticky = this.containerTop - this.topOffset;
    const stickyElementTop = stickyRect.top + scrollTop;

    const scrollingDown = scrollTop > this.lastScroll;
    this.lastScroll = scrollTop;
    this.isShortSticky = false;

    const diff = Math.abs(this.stickyHeight - this.containerHeight);

    this.sticky.classList.remove('is-short-sticky');

    if (diff < 5) {
      this.setStickyStyle({});
      return;
    }

    if (this.stickyHeight <= windowHeight - this.topOffset - this.bottomOffset) {
      this.isShortSticky = true;
      this.sticky.classList.add('is-short-sticky');
      this.setStickyStyle({ position: 'sticky' });
      return;
    }

    if (scrollTop >= startSticky) {
      const scrollBottom = scrollTop + windowHeight;
      const stickyElementBottom = stickyElementTop + this.stickyHeight;
      const stickyOffsetToWindowTop = stickyElementTop - scrollTop;
      const stickyOffsetToContainer = stickyElementTop - this.containerTop;

      const isStickyBottom = (scrollBottom - this.bottomOffset >= stickyElementBottom - this.bottomOffset);
      const isPositionBottom = scrollBottom - this.bottomOffset >= this.containerTop + this.containerHeight - this.bottomOffset;

      if (scrollingDown) {
        if (scrollTop >= this.containerTop + this.topOffset) {
          if (isPositionBottom) {
            if (this.stickyHeight >= this.containerHeight - 2) {
              this.setStickyStyle({});
              return;
            }
            this.setStickyStyle({ position: 'sticky', top: this.topOffset + 'px', bottom: 'auto' });
          } else if (isStickyBottom) {
            this.setStickyStyle({ position: 'fixed', bottom: this.bottomOffset + 'px', top: 'auto' });
          } else {
            this.setStickyStyle({ position: 'absolute', top: Math.round(stickyOffsetToContainer) + 'px' });
          }
        }
      } else {
        if (Math.abs(stickyOffsetToWindowTop) > 0) {
          if (stickyOffsetToWindowTop >= 0) {
            this.setStickyStyle({ position: 'sticky' });
          } else if (!isPositionBottom) {
            this.setStickyStyle({ position: 'absolute', top: Math.round(stickyOffsetToContainer) + 'px' });
          }
        }
      }
    } else {
      this.setStickyStyle({});
    }
  }

  setStickyStyle(newStyle) {
    if (!this.sticky) return;

    if (this.prevPosition === newStyle.position) {
      if (newStyle.position === 'absolute') {
        const diff = Math.abs(
          (parseInt(newStyle.top) || 0) - (parseInt(this.stickyStyles.top) || 0)
        );
        if (diff < 2) return;
      } else {
        return;
      }
    }

    this.stickyStyles = newStyle;
    this.prevPosition = newStyle.position;

    // Применяем стили
    Object.assign(this.sticky.style, {
      position: newStyle.position || '',
      top: newStyle.top || '',
      bottom: newStyle.bottom || ''
    });

    // Убеждаемся, что CSS переменная с шириной контейнера установлена
    if (this.containerWidth > 0) {
      this.sticky.style.setProperty('--sticky-width', `${this.containerWidth}px`);
    }
  }
}

// Функция для инициализации всех sticky
function initAllSticky() {
  const containers = document.querySelectorAll('.js-sticky-container');

  containers.forEach(container => {
    if (!container._stickyInstance) {
      const instance = new StickyElement(container);
      container._stickyInstance = instance;
    }
  });

  return window.__stickyInstances || [];
}

// Автоматическая инициализация
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAllSticky();
    });
  } else {
    initAllSticky();
  }
}

// Для Astro
if (typeof window !== 'undefined') {
  window.addEventListener('astro:page-load', () => {
    initAllSticky();
  });
}

/**
 * Плавная прокрутка к элементу или позиции
 * @param {Element|Window|Document} target - Целевой элемент
 * @param {Object} options - Опции прокрутки
 * @param {number} options.duration - Длительность анимации в мс (по умолчанию 500)
 * @param {number} options.offset - Смещение от цели в px (по умолчанию 0)
 * @param {string} options.easing - Тип easing функции ('linear', 'easeInOut', 'easeOutCubic')
 * @param {Function} options.onComplete - Callback после завершения
 * @param {number} options.onCompleteDelay - Задержка callback в мс
 * @returns {Promise} Промис для отслеживания завершения
 */
function scrollTo(target, options = {}) {
    const {
        duration = 500,
        offset = 0,
        easing = 'easeInOut',
        onComplete = null,
        onCompleteDelay = 0
    } = options;

    // Отмена предыдущей анимации
    if (window.__scrollAnimationFrame) {
        cancelAnimationFrame(window.__scrollAnimationFrame);
    }

    // Определение целевой позиции
    let targetY;

    if (target instanceof Element) {
        const rect = target.getBoundingClientRect();
        targetY = window.scrollY + rect.top - offset;
    } else if (target === window || target === document || typeof target === 'number') {
        targetY = typeof target === 'number' ? target : 0;
    } else {
        return Promise.reject(new Error("Invalid target. Use element, window, document, or number."));
    }

    const startY = window.scrollY;
    const diff = targetY - startY;

    // Если разница маленькая, просто прыгаем
    if (Math.abs(diff) < 1) {
        window.scrollTo(0, targetY);
        onComplete?.();
        return Promise.resolve();
    }

    // Easing функции
    const easings = {
        linear: t => t,
        easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        easeOutCubic: t => 1 - Math.pow(1 - t, 3),
        easeInCubic: t => t * t * t
    };

    const easingFn = easings[easing] || easings.easeInOut;

    let startTime = null;

    return new Promise((resolve) => {
        function animate(currentTime) {
            if (!startTime) startTime = currentTime;

            const elapsed = currentTime - startTime;
            const rawProgress = Math.min(1, elapsed / duration);
            const easedProgress = easingFn(rawProgress);

            window.scrollTo(0, startY + diff * easedProgress);

            if (elapsed < duration) {
                window.__scrollAnimationFrame = requestAnimationFrame(animate);
            } else {
                // Финальная коррекция
                window.scrollTo(0, targetY);

                // Callback с задержкой
                if (onComplete) {
                    if (onCompleteDelay > 0) {
                        setTimeout(() => {
                            onComplete();
                            resolve();
                        }, onCompleteDelay);
                    } else {
                        onComplete();
                        resolve();
                    }
                } else {
                    resolve();
                }
            }
        }

        window.__scrollAnimationFrame = requestAnimationFrame(animate);
    });
}

/**
 * Инициализирует обработчики кликов для элементов .js-scroll-to
 * @param {Object} options - опции для прокрутки (передаются в scrollTo)
 * @param {HTMLElement|Document|string} [container] - контейнер для поиска элементов (по умолчанию document)
 * @param {Object} observerOptions - опции для MutationObserver
 * @returns {Object} объект с методом destroy для очистки
 */
function initScrollToHandler(options = {}, container = document, observerOptions = {}) {
    // Получаем контейнер, если передан селектор
    const context = container instanceof HTMLElement
        ? container
        : (typeof container === 'string'
            ? document.querySelector(container)
            : document);

    if (!context) {
        console.error('Container not found:', container);
        return {
            destroy: () => {} // пустая функция для предотвращения ошибок
        };
    }

    // Обработчик клика с делегированием
    const clickHandler = (e) => {
        const button = e.target.closest('.js-scroll-to');
        if (!button) return;

        e.preventDefault();

        const targetSelector = button.dataset.goto;
        if (!targetSelector) {
            console.warn('data-goto attribute is missing on element:', button);
            return;
        }

        // Определяем целевой элемент
        let targetElement;

        if (targetSelector.startsWith('#')) {
            targetElement = document.getElementById(targetSelector.slice(1));
        } else {
            targetElement = document.querySelector(targetSelector);
        }

        if (!targetElement) {
            console.warn(`Target element not found: ${targetSelector}`);
            return;
        }

        // Получаем индивидуальные опции из data-атрибутов кнопки
        const buttonOptions = {
            ...options,
            duration: button.dataset.duration
                ? parseInt(button.dataset.duration, 10)
                : options.duration,
            offset: button.dataset.offset
                ? parseInt(button.dataset.offset, 10)
                : options.offset,
            easing: button.dataset.easing || options.easing,
            onCompleteDelay: button.dataset.onCompleteDelay
                ? parseInt(button.dataset.onCompleteDelay, 10)
                : options.onCompleteDelay
        };

        // Создаем колбэк из data-атрибута если есть
        let onComplete = options.onComplete;
        if (button.dataset.onComplete && typeof window[button.dataset.onComplete] === 'function') {
            onComplete = window[button.dataset.onComplete].bind(button);
        }

        // Вызываем прокрутку
        scrollTo(targetElement, {
            ...buttonOptions,
            onComplete
        }).catch(error => {
            console.error('Scroll failed:', error);
        });
    };

    // Добавляем обработчик на контейнер (делегирование)
    context.addEventListener('click', clickHandler);

    // Настройки MutationObserver по умолчанию
    const defaultObserverOptions = {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
        ...observerOptions
    };

    // Создаем MutationObserver для отслеживания новых элементов .js-scroll-to
    const observer = new MutationObserver((mutations) => {
        let hasNewScrollButtons = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Проверяем добавленные узлы
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) { // Element node
                        // Проверяем сам элемент
                        if (node.classList && node.classList.contains('js-scroll-to')) {
                            hasNewScrollButtons = true;
                            break;
                        }
                        // Проверяем дочерние элементы
                        if (node.querySelectorAll) {
                            const nestedButtons = node.querySelectorAll('.js-scroll-to');
                            if (nestedButtons.length > 0) {
                                hasNewScrollButtons = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (hasNewScrollButtons) break;
        }

        if (hasNewScrollButtons) {
            // Можно вызвать колбэк если нужно
            if (options.onNewElementsAdded) {
                options.onNewElementsAdded();
            }

            // Логирование для отладки
            if (options.debug) {
                console.log('New .js-scroll-to elements detected');
            }
        }
    });

    // Запускаем наблюдение
    observer.observe(context, defaultObserverOptions);

    // Дополнительно: обрабатываем динамическую загрузку через History API (SPA)
    const handleHistoryChange = () => {
        // Перепроверяем наличие элементов после навигации в SPA
        if (options.debug) {
            console.log('History changed, scroll handler still active');
        }
    };

    window.addEventListener('popstate', handleHistoryChange);

    // Для SPA на основе pushState
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleHistoryChange();
    };

    // Функция для полной очистки
    function destroy() {
        context.removeEventListener('click', clickHandler);
        observer.disconnect();
        window.removeEventListener('popstate', handleHistoryChange);

        // Восстанавливаем оригинальный pushState если он был изменен
        if (history.pushState !== originalPushState) {
            history.pushState = originalPushState;
        }
    }

    // Возвращаем объект с методами управления
    return {
        destroy,

        // Метод для принудительной переинициализации
        reinit: () => {
            destroy();
            return initScrollToHandler(options, container, observerOptions);
        },

        // Метод для проверки статуса
        isActive: () => {
            return observer && !!context;
        },

        // Метод для временной приостановки
        pause: () => {
            observer.disconnect();
        },

        // Метод для возобновления
        resume: () => {
            observer.observe(context, defaultObserverOptions);
        }
    };
}

// Мобильное меню для tab-menu
function initMobileTabMenu() {
    const tabMenus = document.querySelectorAll('.js-tabs-menu-mobile');

    if (!tabMenus.length) return;

    tabMenus.forEach(menu => {
        const button = menu.querySelector('.js-tabs-menu-mobile-button');
        if (!button) return;

        // Добавляем обработчик клика на кнопку
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu(menu, button);
        });

        // Закрытие при клике вне области
        document.addEventListener('click', (e) => {
            if (!menu.classList.contains('is-mobile-open')) return;

            const isClickInside = menu.contains(e.target);

            if (!isClickInside) {
                closeMobileMenu(menu, button);
            }
        });

        // Закрытие при нажатии ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-mobile-open')) {
                closeMobileMenu(menu, button);
            }
        });

        // Закрытие при клике на элемент меню
        const menuItems = menu.querySelectorAll('.js-tabs-menu-mobile-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (menu.classList.contains('is-mobile-open')) {
                    closeMobileMenu(menu, button);
                }
            });
        });
    });
}

function toggleMobileMenu(menu, button) {
    if (menu.classList.contains('is-mobile-open')) {
        closeMobileMenu(menu, button);
    } else {
        openMobileMenu(menu, button);
    }
}

function openMobileMenu(menu, button) {
    menu.classList.add('is-mobile-open');
    button.classList.add('is-active');
    button.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu(menu, button) {
    menu.classList.remove('is-mobile-open');
    button.classList.remove('is-active');
    button.setAttribute('aria-expanded', 'false');
}

function setVariables() {
    /**
     * Set scrollbar width
    */
    const setScrollbarWidth = () => {
        const scrollbarWidth = `${window.innerWidth - document.body.offsetWidth}px`;
        document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth);
    };

    // setScrollTopProperty();

    /**
     * Set variable 1/100 screen height
    */
    const setScreenHeightProperty = () => {
        document.documentElement.style.setProperty('--vh', `${(window.innerHeight * 0.01).toFixed(2)}px`);
    };

    /**
     * Set variable 1/100 dynamic screen height
    */
    const setScreenDynamicHeightProperty = () => {
        document.documentElement.style.setProperty('--dvh', `${(window.innerHeight * 0.01).toFixed(2)}px`);
    };

    setScreenDynamicHeightProperty();
    setScreenHeightProperty();
    setScrollbarWidth();

    window.addEventListener('resize', () => {
        // setScrollTopProperty();
        setScrollbarWidth();
        setScreenDynamicHeightProperty();
    });

    window.addEventListener('scroll', () => {
        // setScreenDynamicHeightProperty();
    });
}

/**
  * Search form result
*/

function setSearchForm() {
    const searchForms = document.querySelectorAll('.js-search-form');

    for (let i = 0; i < searchForms.length; i += 1) {
        const searchForm = searchForms[i];
        const searchFormInput = searchForm.querySelector('.js-search-form-input');
        const searchFormClear = searchForm.querySelector('.js-search-form-clear');

        /**
         * Show search input clearing
        */
        const showSearchInputClear = () => {
            if (searchFormClear) {
                searchFormClear.classList.add('is-visible');
            }
        };

        /**
         * Hide search input clearing
        */
        const hideSearchInputClear = () => {
            if (searchFormClear) {
                searchFormClear.classList.remove('is-visible');
            }
        };

        /**
         * Checking input value
        */
        const checkingInputValue = () => {
            if (searchFormInput) {
                if (searchFormInput.value.trim() !== '') {
                    showSearchInputClear();
                } else {
                    hideSearchInputClear();
                }
            }
        };

        checkingInputValue();

        if (searchFormInput) {
            searchFormInput.addEventListener('input', () => {
                checkingInputValue();
            });
        }

        if (searchFormClear) {
            searchFormClear.addEventListener('click', () => {
                if (searchFormInput) {
                    searchFormInput.value = '';
                    searchFormInput.focus();
                }

                hideSearchInputClear();
            });
        }
    }
}

/*
     ----------------
	|  HEADER  SEARCH  |
	 ----------------
*/
/**
  * Header search
*/

function setHeaderSearch() {
    const headerSearch = document.querySelector('.js-header-search');

    if (headerSearch) {
        const headerSearchBackdrop = document.querySelector('.js-header-backdrop');
        const headerSearchInput = document.querySelector('.js-header-search-input');
        const headerSearchResult = document.querySelector('.js-header-search-result');
        const headerSearchClear = document.querySelector('.js-header-search-clear');
        const headerSearchClose = document.querySelector('.js-header-search-close');
        let isSearchOpen = false;

        /**
            * Adding a variable search scrollbar width
        */
        const setSearchScrollbar = () => {
            const scrollbarCompensate = `${window.innerWidth - document.body.offsetWidth}px`;
            document.documentElement.style.setProperty('--search-scrollbar', scrollbarCompensate);
        };

        /**
            * Removing variable width search scrollbar
        */
        const removeSearchScrollbar = () => {
            document.documentElement.style.removeProperty('--search-scrollbar');
        };

        /**
            * Update scrollbar
        */
        const updateSearchScrollbar = () => {
            const scrollbar = headerSearch.querySelector('.simplebar-content-wrapper');

            if (scrollbar) {
                scrollbar.scroll(0, 0);
            }
        };

        /**
         * Open search
        */
        const openSearch = () => {
            if (!isSearchOpen) {
                setSearchScrollbar();

                document.body.classList.add('is-active-search');
                headerSearch.classList.add('is-active');

                isSearchOpen = true;
            }
        };

        /**
         * Close search
        */
        const closeSearch = () => {
            if (isSearchOpen) {
                removeSearchScrollbar();
                updateSearchScrollbar();

                document.body.classList.remove('is-active-search');
                headerSearch.classList.remove('is-active');

                isSearchOpen = false;

            }
        };

        /**
         * Show search result
        */
        const showSearchResult = () => {
            if (headerSearchResult) {
                headerSearchResult.classList.add('is-visible');
            }
        };

        /**
         * Hide search result
        */
        const hideSearchResult = () => {
            if (headerSearchResult) {
                updateSearchScrollbar();
                headerSearchResult.classList.remove('is-visible');

            }
        };

        /**
         * Checking input value
         * @param  {Boolean} isShowResultPopup - whether to show a search result popup
        */
        const checkingInputValue = (isShowResultPopup = true) => {
            if (headerSearchInput) {
                if (headerSearchInput.value.trim().length > 1) {
                    if (isShowResultPopup) {
                        showSearchResult();
                    }
                } else {
                    hideSearchResult();
                }
            }
        };

        if (headerSearchInput) {
            headerSearchInput.addEventListener('focus', () => {
                openSearch();
                checkingInputValue(false);
            });

            headerSearchInput.addEventListener('click', () => {
                openSearch();
                checkingInputValue(false);
            });

            headerSearchInput.addEventListener('input', () => {
                checkingInputValue();
            });
        }

        if (headerSearchClear) {
            headerSearchClear.addEventListener('click', () => {
                hideSearchResult();
            });
        }

        if (headerSearchClose) {
            headerSearchClose.addEventListener('click', () => {
                closeSearch();
                hideSearchResult();
            });
        }

        if (headerSearchBackdrop) {
            headerSearchBackdrop.addEventListener('click', () => {
                closeSearch();
                hideSearchResult();
            });
        }


        document.addEventListener('click', (event) => {
            const { target } = event;

            if (
                target !== headerSearch && !target.closest('.js-header-search')
                && target !== headerSearchClose && !target.closest('.js-header-search-close')
                && target !== headerSearchClear && !target.closest('.js-header-search-clear')
                && !target.classList.contains('js-header-search-open') && !target.closest('.js-header-search-open')
            ) {
                closeSearch();
                hideSearchResult();
            }

            if (
                target.classList.contains('js-header-search-open') || target.closest('.js-header-search-open')
            ) {
                if (!isSearchOpen) {
                    openSearch();

                    if (headerSearchInput) {
                        setTimeout(() => {
                            headerSearchInput.focus();
                        }, 50);
                    }
                } else {
                    closeSearch();
                    hideSearchResult();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if ((e.code === 'Tab' || e.key === 'Tab')) {
                if (headerSearch.classList.contains('is-active')
                    && !document.activeElement.closest('.js-header-search')) {
                    closeSearch();
                    hideSearchResult();
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (document.activeElement.closest('.js-header-search') && (e.key === 'Escape' || e.code === 'Escape')) {
                closeSearch();
                hideSearchResult();
            }
        });
    }
}

/*
     ----------------
	|  HEADER  MENU  |
	 ----------------
*/
/**
  * Header menu
  * @param  {number} widthMobile - browser width at which the menu
  transitions to the responsive menu
  * @param  {number} delay - menu opening time (also needs to be changed in CSS)
  * @param  {number} duration - duration of submenu opening (also needs to be changed in CSS)
*/

function headerMenu(widthMobile = 991, delay = 300, duration = 400) {
    const menu = document.querySelector('.js-menu');

    if (menu) {
        const menuBurger = menu.querySelector('.js-menu-burger');
        const menuPopup = menu.querySelector('.js-menu-popup');
        const menuContainer = menu.querySelector('.js-menu-container');
        const menuBackdrop = menu.querySelector('.js-menu-backdrop');
        const menuClose = menu.querySelector('.js-menu-close');
        const menuDropdownItems = menu.querySelectorAll('.js-menu-dropdown');
        const menuBack = menu.querySelector('.js-menu-back');
        const catalogDropdownItems = menu.querySelectorAll('.js-menu-catalog-dropdown');
        const catalogButton = menu.querySelector('.js-menu-catalog-button');
        const catalogPopup = menu.querySelector('.js-menu-catalog-popup');
        const catalogScroll = menu.querySelector('.js-menu-catalog-scroll');

        let isMenuReady = true;
        let isMenuOpen = false;
        let isCatalogPopupOpen = false;
        const focusElements = [
            'a[href]',
            'area[href]',
            'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
            'select:not([disabled]):not([aria-hidden])',
            'textarea:not([disabled]):not([aria-hidden])',
            'button:not([disabled]):not([aria-hidden])',
            'iframe',
            'object',
            'embed',
            '[contenteditable]',
            '[tabindex]:not([tabindex^="-"])'
        ];
        const focusCatcher = (e, menu) => {
            // Находим все элементы на которые можно сфокусироваться
            const nodes = menu.querySelectorAll(focusElements);

            //преобразуем в массив
            const nodesArray = Array.prototype.slice.call(nodes);

            //если фокуса нет в окне, то вставляем фокус на первый элемент
            if (!menu.contains(document.activeElement)) {
                nodesArray[0].focus();
                e.preventDefault();
            } else {
                const focusedItemIndex = nodesArray.indexOf(document.activeElement);

                if (e.shiftKey && focusedItemIndex === 0) {
                    //перенос фокуса на последний элемент
                    nodesArray[nodesArray.length - 1].focus();
                    e.preventDefault();
                }

                if (!e.shiftKey && focusedItemIndex === nodesArray.length - 1) {
                    //перенос фокуса на первый элемент
                    nodesArray[0].focus();
                    e.preventDefault();
                }
            }
        };

        /**
            * Is Adaptive Menu
        */
        const isAdaptiveMenu = () => {
            return window.innerWidth <= widthMobile;
        };

        /**
            * Is Tablet Menu
        */
        const isTabletMenu = () => {
            return window.innerWidth <= 991;
        };

        /**
            * Adding the body class of the opened menu and assigning the scrollbar
            width padding variable
        */
        const lockBody = () => {
            const scrollbarCompensate = `${window.innerWidth - document.body.offsetWidth}px`;
            document.documentElement.style.setProperty('--menu-scrollbar-width', scrollbarCompensate);
            document.body.classList.add('menu-open');
        };

        /**
            * Removing the open menu's body class and removing the scrollbar
            width padding variable
        */
        const unlockBody = () => {
            document.documentElement.style.removeProperty('--menu-scrollbar-width');
            document.body.classList.remove('menu-open');
        };

           /**
            * Catalog popup opening
        */
        const openCatalogPopup = () =>  {
            isCatalogPopupOpen = true;

            catalogButton.classList.add('is-active');
            catalogPopup.classList.add('is-active');
            catalogScroll.scrollTo(0, 0);
            document.body.classList.add('catalog-open');

        };

        /**
            * Closing catalog popup
        */
        const closeCatalogPopup = () =>  {
            isCatalogPopupOpen = false;
            catalogButton.classList.remove('is-active');
            catalogPopup.classList.remove('is-active');
            document.body.classList.remove('catalog-open', 'submenu-open');
        };

        /**
            * Menu opening
        */
        const openMenu = () =>  {
            if (isMenuReady) {
                isMenuReady = false;

                if (menuBurger) {
                    menuBurger.classList.add('is-active');
                }

                if (menuBackdrop) {
                    menuBackdrop.classList.add('is-active');
                }

                if (menuPopup) {

                    menuPopup.classList.add('is-visible');
                    menuPopup.scrollTo(0, 0);
                    menuPopup.setAttribute('aria-disabled', false);

                    if (menuContainer) {
                        menuContainer.scrollTo(0, 0);
                    }


                    catalogDropdownItems.forEach((item) => {
                        const catalogSubmenu = item.querySelector('.js-menu-catalog-submenu');

                        if (catalogSubmenu) {
                            catalogSubmenu.scrollTo(0, 0);
                        }
                    });

                    setTimeout(() => {
                        menuPopup.classList.add('is-active');
                    }, 1);
                }

                isMenuOpen = true;

                lockBody();

                setTimeout(() => {
                    isMenuReady = true;

                    if (menuClose) {
                        menuClose.focus();
                    }
                }, delay);
            }
        };

        /**
            * Closing the menu
        */
        const closeMenu = () => {
            if (isMenuReady) {
                isMenuReady = false;

                if (menuBurger) {
                    menuBurger.classList.remove('is-active');
                    menuBurger.focus();
                }

                if (menuBackdrop) {
                    menuBackdrop.classList.remove('is-active');
                }

                if (menuPopup) {
                    menuPopup.classList.remove('is-active');
                    menuPopup.setAttribute('aria-disabled', true);

                    setTimeout(() => {
                        menuPopup.classList.remove('is-visible');

                    }, delay);
                }

                isMenuOpen = false;



                unlockBody();

                setTimeout(() => {
                    isMenuReady = true;
                      closeCatalogPopup();

                    const activeCatalogDropdown = menu.querySelector('.js-menu-catalog-dropdown.is-active');
                    const activeMenuDropdown = menu.querySelector('.js-menu-dropdown.is-active');

                    if (activeCatalogDropdown) {
                        activeCatalogDropdown.classList.remove('is-active');
                    }

                    if (activeMenuDropdown) {
                        activeMenuDropdown.classList.remove('is-active');
                    }
                }, delay);
            }
        };

        /**
            * Set popup dialog mode
        */
        const setPopupDialogMode = () => {
            if (menuPopup) {
                if (isAdaptiveMenu()) {
                    menuPopup.setAttribute('role', 'dialog');
                    menuPopup.setAttribute('aria-modal', true);
                } else {
                    menuPopup.removeAttribute('role');
                    menuPopup.removeAttribute('aria-modal');
                }
            }
        };


        setPopupDialogMode();

        menuDropdownItems.forEach((item) => {
            const menuLink = item.querySelector('.js-menu-link');

            if (menuLink) {
                menuLink.addEventListener('click', (e) => {
                    e.preventDefault();

                    item.classList.toggle('is-active');
                    item.classList.toggle('is-visible');

                    if (item.classList.contains('is-active')) {
                        document.body.classList.add('submenu-open');
                    } else {
                        document.body.classList.remove('submenu-open');
                    }
                });
            }

            item.addEventListener('mouseenter', () => {
                if (!isAdaptiveMenu()) {
                    item.classList.add('is-active', 'is-visible');
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!isAdaptiveMenu()) {
                    item.classList.remove('is-active', 'is-visible');
                }
            });
        });

        catalogDropdownItems.forEach((item) => {
            const menuLink = item.querySelector('.js-menu-catalog-link');
            const catalogSubmenu = item.querySelector('.js-menu-catalog-submenu');

            if (menuLink) {
                menuLink.addEventListener('click', (e) => {
                    e.preventDefault();

                    if (isTabletMenu()) {
                        item.classList.toggle('is-active');
                    }

                    if (catalogSubmenu) {
                        catalogSubmenu.scrollTo(0, 0);
                    }
                });
            }
        });

        if (menuBurger) {
            menuBurger.addEventListener('click', () => {
                if (menuBurger.classList.contains('is-active')) {
                    closeMenu();
                } else {
                    openMenu();
                }
            });
        }

        if (menuClose) {
            menuClose.addEventListener('click', () => {
                closeMenu();
            });
        }

        if (menuBackdrop) {
            menuBackdrop.addEventListener('click', () => {
                closeMenu();
            });
        }

        if (catalogButton) {
            catalogButton.addEventListener('click', () => {
                if (isCatalogPopupOpen) {
                    closeCatalogPopup();
                } else {
                    openCatalogPopup();
                }
            });
        }

        if (menuBack) {
            menuBack.addEventListener('click', () => {
                const activeMenuDropdown = menu.querySelector('.js-menu-dropdown.is-active');
                const activeCatalogDropdown = menu.querySelector('.js-menu-catalog-dropdown.is-active');

                if (activeCatalogDropdown) {
                    activeCatalogDropdown.classList.remove('is-active');
                } else if (activeMenuDropdown) {
                    activeMenuDropdown.classList.remove('is-active', 'is-visible');
                    document.body.classList.remove('submenu-open');

                } else {
                    closeCatalogPopup();
                }

            });
        }

        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Escape' || e.key === 'Escape') && isCatalogPopupOpen) {
                closeCatalogPopup();
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Escape' || e.key === 'Escape') && isMenuOpen) {
                closeMenu();
            }

            if ((e.code === 'Tab' || e.key === 'Tab') && isMenuOpen && menuPopup) {
                focusCatcher(e, menuPopup);
            }
        });

        document.addEventListener('keyup', (e) => {
            const activeDropdown = menu.querySelector('.js-menu-dropdown.is-active');

            if ((e.code === 'Tab' || e.key === 'Tab') ) {
                if (activeDropdown && !isAdaptiveMenu()
                && !document.activeElement.closest('.js-menu-dropdown.is-active')) {
                    activeDropdown.classList.remove('is-active', 'is-visible');
                }

                if (isCatalogPopupOpen && !isAdaptiveMenu()
                && !document.activeElement.closest('.js-menu-catalog')) {
                    closeCatalogPopup();
                }
            }
        });

        document.addEventListener('click', (e) => {
            const activeDropdown = menu.querySelector('.js-menu-dropdown.is-active');

            if (activeDropdown && !isAdaptiveMenu()) {
                if (!e.target.classList.contains('js-menu-dropdown')
                && !e.target.closest('.js-menu-dropdown')) {
                    activeDropdown.classList.remove('is-active', 'is-visible');
                }
            }

            if (isCatalogPopupOpen && !isAdaptiveMenu()) {
                if (!e.target.classList.contains('js-menu-catalog-popup')
                && !e.target.closest('.js-menu-catalog-popup')
                && !e.target.classList.contains('js-menu-catalog-button')
                && !e.target.closest('.js-menu-catalog-button'))
                {
                    closeCatalogPopup();
                }
            }
        });

        window.addEventListener('resize', setPopupDialogMode);
    }
}

/*
     ---------------
	|   FIX HEADER   |
	  ---------------
*/

function headerFixed() {
    const header = document.querySelector('.js-header');

    if (!header) return;

    const fixedStartClass = 'is-fixed-start';
    const fixedClass = 'is-fixed';
    const fixedClassVisible = 'is-fixed-visible';
    let offsetTop = 0;
    let scrollPos = 0;
    let scrollTop = 0;
    let headerHeight;
    let positionTop;

    fixed();

	window.addEventListener('scroll', fixed);

	function fixed() {
		scrollTop = window.pageYOffset;
		headerHeight = header.offsetHeight;
		positionTop = header.getBoundingClientRect().top + scrollTop;

        offsetTop = headerHeight;

        if (scrollTop > (positionTop + offsetTop)) {
			header.classList.add(fixedStartClass);
		} else {
            header.classList.remove(fixedStartClass);
        }

		if (scrollTop > (positionTop + offsetTop * 1.5)) {
			{
				header.style.height = `${headerHeight}px`;
			}

            header.classList.add(fixedClass);

            if (scrollTop < scrollPos) {
                header.classList.add(fixedClassVisible);
            } else {
                header.classList.remove(fixedClassVisible);
            }
		} else {
			header.classList.remove(fixedClass, fixedClassVisible);

			{
				header.style.removeProperty('height');
			}
		}

        scrollPos = scrollTop;
	}
}

function initFilters() {
    let isFiltersOpen = false;
    let isFiltersReady = true;

    const delay = 400;
    const focusElements = [
        'a[href]',
        'area[href]',
        'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
        'select:not([disabled]):not([aria-hidden])',
        'textarea:not([disabled]):not([aria-hidden])',
        'button:not([disabled]):not([aria-hidden])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex^="-"])'
    ];
    const focusCatcher = (e, menu) => {
        // Находим все элементы на которые можно сфокусироваться
        const nodes = menu.querySelectorAll(focusElements);

        //преобразуем в массив
        const nodesArray = Array.prototype.slice.call(nodes);

        //если фокуса нет в окне, то вставляем фокус на первый элемент
        if (!menu.contains(document.activeElement)) {
            nodesArray[0].focus();
            e.preventDefault();
        } else {
            const focusedItemIndex = nodesArray.indexOf(document.activeElement);

            if (e.shiftKey && focusedItemIndex === 0) {
                //перенос фокуса на последний элемент
                nodesArray[nodesArray.length - 1].focus();
                e.preventDefault();
            }

            if (!e.shiftKey && focusedItemIndex === nodesArray.length - 1) {
                //перенос фокуса на первый элемент
                nodesArray[0].focus();
                e.preventDefault();
            }
        }
    };

    /**
        * Assigning the scrollbar width padding variable
    */
    const setScrollbarCompensate = () => {
        const scrollbarCompensate = `${window.innerWidth - document.body.offsetWidth}px`;
        document.documentElement.style.setProperty('--filters-scrollbar-compensate', scrollbarCompensate);
    };

    /**
        * Removing the scrollbar width padding variable
    */
    const removeScrollbarCompensate = () => {
        document.documentElement.style.removeProperty('--filters-scrollbar-compensate');
    };

    /**
        * Open filters
    */
    const openFilters = () =>  {
        const filtersEl = document.querySelector('.js-filters');

        if (isFiltersReady && filtersEl) {
            const filtersContent = filtersEl.querySelector('.js-filters-content');
            const filtersInner = filtersEl.querySelector('.js-filters-inner');
            const filtersBackdrop = filtersEl.querySelector('.js-filters-backdrop');
            const filtersClose = filtersEl.querySelector('.js-filters-close');

            isFiltersReady = false;
            isFiltersOpen = true;

            if (filtersBackdrop) {
                filtersBackdrop.classList.add('is-visible');
            }

            if (filtersContent) {
                filtersContent.classList.add('is-visible');
                filtersContent.setAttribute('aria-disabled', false);

                setTimeout(() => {
                    filtersContent.classList.add('is-open');
                }, 1);
            }

            setScrollbarCompensate();

            document.body.classList.add('is-filters-active');

            if (filtersInner) {
                filtersInner.scroll(0, 0);
            }

            setTimeout(() => {
                isFiltersReady = true;

                if (filtersClose) {
                    filtersClose.focus();
                }
            }, delay);
        }
    };

    /**
        * Close filters
    */
    const closeFilters = () => {
        const filtersEl = document.querySelector('.js-filters');

        if (isFiltersReady && filtersEl) {
            const filtersToggleButton = document.querySelector('.js-filters-toggle-button');
            const filtersContent = filtersEl.querySelector('.js-filters-content');
            const filtersBackdrop = filtersEl.querySelector('.js-filters-backdrop');
            isFiltersReady = false;
            isFiltersOpen = false;

            if (filtersBackdrop) {
                filtersBackdrop.classList.remove('is-visible');
            }

            if (filtersToggleButton) {
                filtersToggleButton.focus();
            }

            if (filtersContent) {
                filtersContent.classList.remove('is-open');
                filtersContent.setAttribute('aria-disabled', true);

                setTimeout(() => {
                    filtersContent.classList.remove('is-visible');
                }, delay);
            }

            removeScrollbarCompensate();

            document.body.classList.remove('is-filters-active');

            setTimeout(() => {
                isFiltersReady = true;
            }, delay);
        }
    };

    const updateShowButtonPosition = (targetEl) => {
        if (!targetEl) return;

        const filters = targetEl.closest('.js-filters');

        if (!filters) return;

        const showButton = document.querySelector('.js-filters-show-button');
        const filtersItemActive = filters.querySelector('.js-filters-item.is-active');

        if (!filtersItemActive || !showButton) return;

        const height = filtersItemActive.offsetHeight;
        showButton.style.top = `${filtersItemActive.offsetTop + height / 2}px`;
    };

    document.addEventListener('click', (event) => {
        const { target } = event;

        if (target.classList.contains('js-filters-toggle-button')
        || target.closest('.js-filters-toggle-button')
        ) {
            if (window.innerWidth < 1200) {
                openFilters();
            }
        }

        if (
            target.classList.contains('js-filters-close')
            || target.classList.contains('js-filters-backdrop')
            || target.closest('.js-filters-close')
            || target.closest('.js-filters-backdrop')
        ) {
            closeFilters();
        }

        if (
            target.classList.contains('js-filters-show-all')
            || target.closest('.js-filters-show-all')
        ) {
            const filterItem = target.closest('.js-filters-item');
            const filtersShowAll = target.classList.contains('js-filters-show-all') ? target : target.closest('.js-filters-show-all');
            const eventStickyRefresh = new CustomEvent('sticky:refresh', {
                bubbles: true,
                detail: { source: 'accordion' }
            });

            if (filterItem && filtersShowAll) {
                if (filterItem.classList.contains('is-show-all')) {
                    filtersShowAll.textContent = filtersShowAll.getAttribute('data-show-text');
                } else {
                    filtersShowAll.textContent = filtersShowAll.getAttribute('data-hidden-text');
                }

                filterItem.classList.toggle('is-show-all');
            }

            setTimeout(() => {
            document.dispatchEvent(eventStickyRefresh);
                
            }, 10);
        }
        if (
            target.classList.contains('js-filters-item-button')
            || target.closest('.js-filters-item-button')
        ) {
            const showButton = document.querySelector('.js-filters-show-button');
            const filtersItem = target.classList.contains('js-filters-item') ? target : target.closest('.js-filters-item');

            if (showButton && filtersItem.classList.contains('is-active')) {
                showButton.classList.remove('is-active');
            }
        }
    });

    document.addEventListener('change', (event) => {
        const { target } = event;

        if (target.classList.contains('js-filters-checkbox')
        ) {
            const filters = target.closest('.js-filters');
            const showButton = document.querySelector('.js-filters-show-button');
            const filtersItem = target.closest('.js-filters-item');
            const filtersItemActive = filters.querySelector('.js-filters-item.is-active');

            if (showButton && filtersItem) {
                if (filtersItemActive) {
                    filtersItemActive.classList.remove('is-active');
                }

                filtersItem.classList.add('is-active');
                showButton.classList.add('is-active');

                updateShowButtonPosition(target);
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.code === 'Escape' || e.key === 'Escape') && isFiltersOpen) {
            closeFilters();
        }

        if ((e.code === 'Tab' || e.key === 'Tab') && isFiltersOpen) {
            const filtersContent = document.querySelector('.js-filters-content');

            if (filtersContent) {
                focusCatcher(e, filtersContent);
            }
        }
    });

    document.addEventListener('accordionOpened', e => {
        updateShowButtonPosition(e.target);
    });

    document.addEventListener('accordionClosed', e => {
        updateShowButtonPosition(e.target);
    });
}

function initViewItems() {
    document.addEventListener('click', (event) => {
        const { target } = event;
        const viewButton = target.classList.contains('js-view-button') ? target : target.closest('.js-view-button');

        if (viewButton) {
            const viewButtonsEl = viewButton.closest('.js-view-buttons');

            if (viewButtonsEl) {
                const viewButtonsActive = viewButtonsEl.querySelector('.js-view-button.is-active');
                const viewItems = document.querySelector('.js-view-items');
                const view = viewButton.getAttribute('data-view');

                if (viewItems) {
                    if (viewButtonsActive) {
                        viewButtonsActive.classList.remove('is-active');
                    }

                    viewItems.classList.remove('is-grid', 'is-list');
                    viewItems.classList.add(`is-${view}`);
                    viewButton.classList.add('is-active');
                }
            }
        }
    });
}

// profitable-slider.js
class ProfitableSlider {
    constructor(container) {
        this.container = container;
        this.items = Array.from(container.querySelectorAll('.js-profitable-slider-item'));
        this.progressBar = container.querySelector('.js-profitable-slider-progress');
        this.currentIndex = this.items.findIndex(item => item.classList.contains('is-active'));
        this.interval = null;
        this.autoPlayDelay = 5000;
        this.progressInterval = null;
        this.isPlaying = true;

        if (this.currentIndex === -1 && this.items.length > 0) {
            this.currentIndex = 0;
            this.items[0].classList.add('is-active');
        }

        this.init();
    }

    init() {
        this.startAutoPlay();
        this.updateProgressBar();
        this.bindEvents();
    }

    bindEvents() {
        // this.container.addEventListener('mouseenter', () => {
        //     this.stopAutoPlay();
        // });

        // this.container.addEventListener('mouseleave', () => {
        //     if (this.isPlaying) {
        //         this.startAutoPlay();
        //         this.updateProgressBar();
        //     }
        // });
    }

    startAutoPlay() {
        this.stopAutoPlay();
        this.interval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
        this.isPlaying = true;
    }

    stopAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.stopProgressAnimation();
    }

    stopProgressAnimation() {
        if (this.progressInterval) {
            clearTimeout(this.progressInterval);
            this.progressInterval = null;
        }
        if (this.progressBar) {
            this.progressBar.style.transition = 'none';
            this.progressBar.style.width = '0%';
            this.progressBar.offsetHeight;
        }
    }

    updateProgressBar() {
        if (!this.progressBar) return;

        this.stopProgressAnimation();

        this.progressBar.style.transition = 'none';
        this.progressBar.style.width = '0%';

        setTimeout(() => {
            this.progressBar.style.transition = `width ${this.autoPlayDelay}ms linear`;
            this.progressBar.style.width = '100%';
        }, 50);
    }

    updateSlideImages(index) {
        const activeItem = this.items[index];
        if (!activeItem) return;

        const images = activeItem.querySelectorAll('.js-profitable-slider-image');
        const sources = activeItem.querySelectorAll('source');

        images.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            const dataSrcset = img.getAttribute('data-srcset');

            if (dataSrc && !img.getAttribute('src')) {
                img.setAttribute('src', dataSrc);
                img.removeAttribute('data-src');
            }

            if (dataSrcset && !img.getAttribute('srcset')) {
                img.setAttribute('srcset', dataSrcset);
                img.removeAttribute('data-srcset');
            }
        });

        sources.forEach(source => {
            const dataSrcset = source.getAttribute('data-srcset');

            if (dataSrcset && !source.getAttribute('srcset')) {
                source.setAttribute('srcset', dataSrcset);
                source.removeAttribute('data-srcset');
            }
        });
    }

    setActiveSlide(index) {
        if (index === this.currentIndex) return;
        if (index < 0) index = this.items.length - 1;
        if (index >= this.items.length) index = 0;

        this.items.forEach(item => {
            item.classList.remove('is-active');
        });

        this.items[index].classList.add('is-active');
        this.updateSlideImages(index);
        this.currentIndex = index;

        if (this.isPlaying) {
            this.startAutoPlay();
            this.updateProgressBar();
        }

        const event = new CustomEvent('slideChange', {
            detail: { index: this.currentIndex, total: this.items.length }
        });
        this.container.dispatchEvent(event);
    }

    nextSlide() {
        this.setActiveSlide(this.currentIndex + 1);
    }

    prevSlide() {
        this.setActiveSlide(this.currentIndex - 1);
    }

    destroy() {
        this.stopAutoPlay();
        this.items = null;
        this.progressBar = null;
    }
}

// Экспортируем функцию инициализации
function initProfitableSliders() {
    const sliders = document.querySelectorAll('.js-profitable-slider');

    sliders.forEach(slider => {
        if (!slider.profitableSlider) {
            slider.profitableSlider = new ProfitableSlider(slider);
        }
    });

    // Загружаем изображения для активных слайдов
    const activeSlides = document.querySelectorAll('.js-profitable-slider-item.is-active');
    activeSlides.forEach(slide => {
        const images = slide.querySelectorAll('.js-profitable-slider-image');
        const sources = slide.querySelectorAll('source');

        images.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            const dataSrcset = img.getAttribute('data-srcset');

            if (dataSrc && !img.getAttribute('src')) {
                img.setAttribute('src', dataSrc);
                img.removeAttribute('data-src');
            }

            if (dataSrcset && !img.getAttribute('srcset')) {
                img.setAttribute('srcset', dataSrcset);
                img.removeAttribute('data-srcset');
            }
        });

        sources.forEach(source => {
            const dataSrcset = source.getAttribute('data-srcset');

            if (dataSrcset && !source.getAttribute('srcset')) {
                source.setAttribute('srcset', dataSrcset);
                source.removeAttribute('data-srcset');
            }
        });
    });
}

document.addEventListener('change', function (e) {
    if (e.target.classList.contains('js-agreement-checkbox')) {
        const form = e.target.closest('form');
        if (form) updateAgreementButton(form);
    }
});

function updateAgreementButton(form) {
    const checkboxes = form.querySelectorAll('.js-agreement-checkbox');
    const button = form.querySelector('.js-agreement-button');

    if (!button) return;

    const allChecked = [...checkboxes].every(cb => cb.checked);

    console.log(allChecked);

    if (!allChecked) {
        button.disabled = true;
        button.classList.add('is-disabled');
    } else {
        button.disabled = false;
        button.classList.remove('is-disabled');
    }
}

// /* Import vendor ************************** */

document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add(deviceType());

    initCheckboxes();
    initBaseTextField();
    initAccordions();
    initTabs();
    initDropdown();

    modal.init();

    initScrollbar();
    initSwiper();
    initFancybox();
    initAllSticky();
    initScrollToHandler({
        offset: 20
    });

    initMobileTabMenu();

    initProfitableSliders();

});

// /* Initialization common scripts ********** */
setVariables();
setSearchForm();

// /* Initialization header scripts ************** */
setHeaderSearch();
// setHeaderPopup();
headerMenu(1199);
headerFixed();

// /* Initialization additional scripts ********** */
initFilters();
initViewItems();
// initTimeline();

document.addEventListener('content:updated', e => {
    const container = e.detail?.container;

    initBaseTextField(container);
    initAccordions(container);
    window.updateTabs(container);
    window.updateDropdowns(container);

    initScrollbar(container);
    initSwiper();
});
