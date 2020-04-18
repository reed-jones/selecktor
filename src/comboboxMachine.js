import { assign, createMachine } from "./statemachine";

const focusStates = {
  closed: {
    entry: ["focusElement"],
    on: {
      OPEN: {
        target: "opened"
      }
    }
  },
  opened: {
    entry: ["focusElement", "clearHighlightedIndex"],
    // exit: ['focusElement'],
    on: {
      CLOSE: {
        target: "closed"
      },

      OPEN: {
        target: "opened"
      },
      FILTER: {
        target: "opened",
        actions: "setFilter"
      },
      SELECT: {
        target: "closed",
        actions: ["setValue", "clearFilter"]
      },
      SELECT_MULTI: {
        target: "opened",
        actions: ["addValue", "clearFilter"]
      },

      SET_HIGHLIGHT_INDEX: {
        target: "opened",
        actions: "setHighlightedIndex"
      }
    }
  }
}
export default (startContext = {}) =>
  createMachine(
    {
      id: "inputfield",
      initial: "unfocused",
      context: {
        // Single Value
        value: null,
        // Multi Values
        values: new Set(),
        // user searchable filter
        filter: "",
        // Keyboard Highlight Index
        highlightIndex: -1,
        // 'focusable' input element
        focusable: null,
        ...startContext
      },
      on: {
        CLEAR: {
          target: "unfocused",
          actions: "clearValues"
        },
        SET_VALUE: {
          actions: "setValue"
        },
        SET_VALUE_MULTI: {
          actions: "setValues"
        }
      },
      states: {
        unfocused: {
          on: {
            FOCUS: "focused.opened",
            REMOVE_MULTI: {
              target: "focused.closed",
              actions: "removeValue"
            },
            OPEN: {
              target: "focused.opened"
            }
          }
        },
        focused: {
          id: "edited",
          initial: "opened",
          entry: [
            "setFocusableElement",
            "focusElement",
            "clearHighlightedIndex"
          ],
          on: {
            BLUR: {
              target: "unfocused",
              actions: ["clearFilter", "blurElement"]
            },
            REMOVE_MULTI: {
              target: "focused.closed",
              actions: "removeValue"
            }
          },
          states: focusStates
        },
      }
    },
    {
      actions: {
        setFilter: assign({
          filter: (context, event) => event.value || ""
        }),

        clearFilter: assign({
          filter: (context, event) => ""
        }),

        setValue: assign({
          value: (context, event) => event.value
        }),

        addValue: assign({
          values: (context, event) => context.values.add(event.value)
        }),

        setValues: assign({
          values: (context, event) =>
            event.value.constructor.name === "Set"
              ? event.value
              : new Set(event.value)
        }),

        removeValue: assign({
          values: (context, event) => {
            context.values.delete(event.value);
            return context.values;
          }
        }),

        clearValues: assign({
          values: (context, event) => new Set(),
          value: null,
          filter: ""
        }),

        setHighlightedIndex: assign({
          highlightIndex: (context, event) => {
            return event.value;
          }
        }),

        clearHighlightedIndex: assign({
          highlightIndex: (context, event) => -1
        }),

        setFocusableElement: assign({
          focusable: (context, event) => event.target ?? context.focusable
        }),

        focusElement: (context, event) => context.focusable?.focus(),
        blurElement: (context, event) => context.focusable?.blur()
      }
    }
  );
