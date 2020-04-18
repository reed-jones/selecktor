import { Machine, assign } from "xstate";

const focusedStates = {
  closed: {
    on: {
      OPEN: {
        target: "opened",
        actions: ['clearHighlightedIndex']
      }
    }
  },
  opened: {
    on: {
      CLOSE: {
        target: "closed"
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
        target: 'opened',
        actions: 'setHighlightedIndex'
      }
    }
  }
};

export default (startContext = {}) =>
  Machine(
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
        REMOVE_MULTI: {
          target: "unfocused",
          actions: "removeValue"
        },

        CLEAR: {
          target: "unfocused",
          actions: "clearValues"
        }
      },
      states: {
        unfocused: {
          on: {
            FOCUS: "focused"
          }
        },
        focused: {
          id: "edited",
          initial: "opened",
          entry: ["setFocusableElement", "focusElement", 'clearHighlightedIndex'],
          on: {
            BLUR: {
              target: "unfocused",
              actions: "clearFilter"
            }
          },
          states: focusedStates
        }
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
            return event.value
          }
        }),

        clearHighlightedIndex: assign({
          highlightIndex: (context, event) => -1
        }),

        setFocusableElement: assign({
          focusable: (context, event) => event.target ?? context.focusable
        }),

        focusElement: (context, event) => context.focusable?.focus()
      }
    }
  );
