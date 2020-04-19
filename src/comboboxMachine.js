import { Machine, assign } from "xstate";
import FuzzySearch from "fuzzy-search";

export default function() {
  const focusedStates = {
    closed: {
      entry: ["focusElement"],
      on: {
        OPEN: {
          target: "opened",
          actions: ["clearHighlightedIndex"]
        },

        // vue data binding can add elements while its closed
        SELECT: {
          target: "closed",
          actions: "setValue"
        },
      }
    },
    opened: {
      entry: ["focusElement"],

      on: {
        CLOSE: "closed",

        FILTER: {
          target: "opened",
          actions: ["setFilter", "keepHighlightedIndexVisible"]
        },

        SELECT: [
          // single mode || close-on-select & multiple mode
          {
            target: "closed",
            cond: (context, event) => !this.multiple || this.closeOnSelect,
            actions: ["selectValue", "emitValue", "clearFilter"]
          },

          // multi mode, leave open on select
          { target: "opened", actions: ["selectValue", "emitValue", "clearFilter"] }
        ],

        SET_HIGHLIGHT_INDEX: {
          target: "opened",
          actions: ["focusElement", "setHighlightedIndex", "scrollToSelection"]
        },

        REMOVE: {
          target: "closed",
          actions: ["removeValue", "emitValue"]
        }
      }
    }
  };

  return Machine(
    {
      id: "root",

      initial: "unfocused",

      context: {
        // Single Value: null, multiple value New Set
        value: this.multiple
          ? this.value instanceof Set
            ? this.value
            : new Set(this.value)
          : this.value,

        options: this.options,

        // user searchable filter
        filter: "",

        // Keyboard Highlight Index
        highlightIndex: -1,

        // 'focusable' input element
        focusable: null
      },
      on: {
        CLEAR: {
          actions: ["clear", "emitValue"]
        },

        REMOVE: {
          actions: ["removeValue", "emitValue"]
        },

        SET_VALUE: {
          actions: "setValue"
        }
      },
      states: {
        unfocused: {
          on: {
            FOCUS: "focused"
          }
        },
        focused: {
          initial: "opened",

          entry: ["setFocusableElement", "focusElement"],
          exit: ["blurElement"],

          on: {
            BLUR: {
              target: "unfocused",
              actions: ["clearFilter", "blurElement"]
            }
          },

          states: focusedStates
        }
      }
    },
    {
      actions: {
        setFilter: assign({
          filter: (context, event) => event.value || "",
          options: (context, event) => {
            if (!this.searchable || !event.value) {
              return this.options;
            }

            return new FuzzySearch(
              this.options,
              this.searchKeys ?? Object.keys(this.options.find(a => true)),
              { sort: true, caseSensitive: false }
            ).search(event.value);
          }
        }),

        clearFilter: assign({
          filter: (context, event) => "",
          options: (context, event) => this.options
        }),

        setHighlightedIndex: assign({
          highlightIndex: (context, event) => event.value
        }),

        clearHighlightedIndex: assign({
          highlightIndex: (context, event) => -1
        }),

        keepHighlightedIndexVisible: assign({
          highlightIndex: (context, event) =>
            Math.min(
              Math.max(context.highlightIndex, 0),
              context.options.length - 1
            )
        }),

        scrollToSelection: (context, event) => {
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs.dropdownOption
                .find(a => [...a.classList].includes("rj-highlighted-item"))
                ?.scrollIntoView(this.scrollOptions);
            });
         });
        },

        setValue: assign({
          value: (context, event) => {
            // single mode
            if (!this.multiple) {
              return event.value;
            }

            // multiple mode
            return event.value instanceof Set
              ? event.value
              : new Set(event.value);
          }
        }),

        selectValue: assign({
          value: (context, event) => {
            if (!this.multiple) {
              return event.value;
            }

            return context.value.add(event.value);
          }
        }),

        removeValue: assign({
          value: (context, event) => {
            if (!this.multiple) {
              return null;
            }

            context.value.delete(event.value);
            return context.value;
          }
        }),

        clear: assign({
          value: (context, event) => (!this.multiple ? null : new Set()),
          filter: () => "",
          highlightIndex: () => -1
        }),

        emitValue: (context, event) => {
          const value = this.multiple
            ? [...context.value]
            : context.value

            this.$emit("input", value);
        },

        setFocusableElement: assign({
          focusable: (context, event) => event.target ?? context.focusable
        }),

        focusElement: (context, event) => {
          context.focusable?.focus();
          this.$emit("focus");
        },
        blurElement: (context, event) => {
          context.focusable?.blur();
          this.$emit("blur");
        }
      },
    }
  );
}
