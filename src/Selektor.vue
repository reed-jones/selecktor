<template>
    <div
        class="rj-combobox"
        :class="{
      open: current.matches('focused.opened'),
      focused: current.matches('focused'),
      unfocused: current.matches('unfocused'),
      multiple,
      single: !multiple,
      searchable
    }"
    >
        <div class="rj-input-section" @click="focus">
            <div class="rj-selected-items">
                <div class="rj-single-item" v-if="!multiple">
                    &nbsp;
                    <template
                        v-if="context.value && (!searchable || !current.matches('focused.opened'))"
                    >{{ labelFunction(context.value) }}</template>
                </div>

                <div class="rj-multiple-items" v-if="multiple">
                    <ul v-if="context.values.size" class="rj-multiple-items-list">
                        <slot
                            v-for="val in context.values"
                            name="tag"
                            :option="val"
                            :remove="_ => removeOption(val)"
                        >
                            <li :key="keyFunction(val)" class="rj-multiple-item">
                                {{ labelFunction(val) }}
                                <span
                                    class="rj-clear-button"
                                    @click.stop="removeOption(val)"
                                >
                                    <CloseIcon />
                                </span>
                            </li>
                        </slot>
                    </ul>
                </div>

                <input
                    type="text"
                    :id="id"
                    ref="editBox"
                    @focus="open"
                    @blur="close"
                    class="rj-filter-input"
                    :placeholder="empty ? placeholder : ''"
                    @keydown="handleKeydown"
                    :readonly="!searchable"
                    :value="context.filter"
                    @input="setFilter"
                />
            </div>

            <!-- Open Close Indicator -->
            <span @click.stop class="rj-indicator">
                <slot
                    name="indicator"
                    :open="current.matches('focused')"
                    :blur="blur"
                    :focus="focus"
                    :clear="clear"
                >
                    <div class="rj-action-btn" v-if="clearable && !empty" @click="clear">
                        <CloseIcon />
                    </div>

                    <div
                        v-else
                        class="rj-action-btn"
                        @click="current.matches('focused.opened') ? close() : focus()"
                    >
                        <ArrowIcon />
                    </div>
                </slot>
            </span>
        </div>

        <!-- Dropdown section -->
        <ul v-if="current.matches('focused.opened')" class="rj-dropdown-list">
            <slot
                v-for="(option, idx) in filteredOptions"
                name="option"
                :option="option"
                :select="_ => selectOption(option)"
                :highlighted="context.highlightIndex === idx"
                :selected="context.values.has(option) || Object.is(option, context.value)"
            >
                <li
                    class="rj-dropdown-item"
                    :class="{
            'rj-selected-item': context.values.has(option) || Object.is(option, context.value),
            'rj-highlighted-item': context.highlightIndex === idx
          }"
                    :key="keyFunction(option)"
                    @click="selectOption(option)"
                >{{ labelFunction(option) }}</li>
            </slot>

            <li v-if="filteredOptions.length === 0" class="rj-dropdown-item">No matches Found</li>
        </ul>
    </div>
</template>

<script>
import { interpret } from "xstate";
// import Fuse from "fuse.js";
import FuzzySearch from "fuzzy-search";
import initComboboxMachine from "./comboboxMachine";
import { hideOnClickOutside } from "./events";

import ArrowIcon from "./icons/ArrowIcon";
import CloseIcon from "./icons/CloseIcon";

export default {
    components: {
        CloseIcon,
        ArrowIcon
    },
    props: {
        // Dom passthrough attributes
        id: String,
        name: String,
        placeholder: String,

        // Current Selected Value
        value: [String, Object, Array],

        // Array of available options
        options: Array,

        // Single or multi select (single by default)
        multiple: Boolean,

        // in multiple mode, close after the first selection
        closeOnSelect: Boolean,

        // type-to-search
        searchable: Boolean,

        // 'clearable' when option(s) have been selected
        clearable: Boolean,

        // keys of object to be searchable
        searchKeys: Array,

        // formatting function for display purposes
        labelFunction: {
            type: Function,
            default: option => option.label
        },

        // formatting function for the key & value
        keyFunction: {
            type: Function,
            default: option => option.key
        }
    },

    computed: {
        filteredOptions() {
            if (!this.searchable || !this.context.filter) {
                return this.options;
            }

            return new FuzzySearch(
                this.options,
                this.searchKeys ?? Object.keys(this.options.find(a => true)),
                { sort: true, caseSensitive: false }
            ).search(this.context.filter);
        },

        empty() {
            return (
                this.context.value === null && this.context.values.size === 0
            );
        }
    },

    created() {
        // Start service on component creation
        this.comboboxService
            .onTransition(state => {
                // Update the current state component data property with the next state
                this.current = state;
                // Update the context component data property with the updated context
                this.context = state.context;
            })
            .start();
    },

    // Add the 'click outside of element' event listener
    mounted() {
        this.removeOutsideClick = hideOnClickOutside(this.$el, $event => {
            this.blur();
        });
    },

    // Remove 'click outside of element' listener
    beforeDestroy() {
        this.removeClickListener();
    },

    data() {
        const comboboxMachine = initComboboxMachine({
            //
        });

        return {
            // Interpret the machine and store it in data
            comboboxService: interpret(comboboxMachine),

            // Start with the machine's initial state
            current: comboboxMachine.initialState,

            // Start with the machine's initial context
            context: comboboxMachine.context
        };
    },

    methods: {
        // Send events to the service
        send(event) {
            this.comboboxService.send(event);
        },

        // Focus Event
        focus() {
            if (this.current.matches("focused")) {
                this.send({ type: "OPEN" });
            } else {
                this.send({ type: "FOCUS", target: this.$refs.editBox });
                this.$emit("focus");
            }
        },

        // Blur Event
        blur() {
            this.send({ type: "BLUR" });
            this.$emit("blur");
        },

        close() {
            this.send({ type: "CLOSE" });
        },

        open() {
            this.send({ type: "OPEN" });
        },

        clear() {
            this.send({ type: "CLEAR" });
            this.emitInput();
        },

        selectOption(value) {
            // ensure its an available option
            if (
                !this.filteredOptions.some(
                    option =>
                        this.keyFunction(option) === this.keyFunction(value)
                )
            ) {
                return;
            }

            const type = this.multiple ? "SELECT_MULTI" : "SELECT";
            this.send({ type, value });

            this.emitInput();

            if (this.multiple && this.closeOnSelect) {
                this.send({ type: "CLOSE" });
            }
        },

        removeOption(value) {
            this.send({ type: "REMOVE_MULTI", value });
            this.emitInput();
        },

        setFilter(event) {
            this.send({ type: "FILTER", value: event.target.value });
            this.send({
                type: "SET_HIGHLIGHT_INDEX",
                value: Math.max(this.context.highlightIndex, 0)
            });
        },

        emitInput() {
            const value = this.multiple
                ? [...this.context.values]
                : this.context.value;

            this.$emit("input", value);
        },

        handleKeydown(e) {
            const keysICareAbout = {
                8: "delete",
                9: "tab",
                13: "enter",
                27: "esc",
                38: "up",
                40: "down"
            };

            if (!(e.which in keysICareAbout)) {
                this.focus();
                return;
            }

            const actions = {
                up: () => {
                    this.focus();
                    this.send({
                        type: "SET_HIGHLIGHT_INDEX",
                        value:
                            (Math.max(this.context.highlightIndex, 0) -
                                1 +
                                this.filteredOptions.length) %
                            this.filteredOptions.length
                    });
                },
                down: () => {
                    this.focus();
                    this.send({
                        type: "SET_HIGHLIGHT_INDEX",
                        value:
                            (this.context.highlightIndex +
                                1 +
                                this.filteredOptions.length) %
                            this.filteredOptions.length
                    });
                },
                delete: () => {
                    if (
                        this.current.matches("focused") &&
                        this.context.values.size
                    ) {
                        this.removeOption(
                            [...this.context.values][
                                this.context.values.size - 1
                            ]
                        );
                    }
                },
                tab: () => {
                    if (this.current.matches("focused")) {
                        this.blur();
                    } else {
                        this.focus();
                    }
                },
                esc: () => {
                    if (this.current.matches("focused.opened")) {
                        this.close();
                    } else {
                        this.focus();
                    }
                },
                enter: () => {
                    if (this.current.matches("focused.opened")) {
                        this.selectOption(
                            this.filteredOptions[this.context.highlightIndex]
                        );
                    } else {
                        this.focus();
                    }
                }
            };

            actions[keysICareAbout[e.which]]();
        },

        // dummy method. will get called on destroy
        removeClickListener() {}
    }
};
</script> <style lang="scss">
* {
    box-shadow: border-box;
}
/* Outer Wrapper */
.rj-combobox {
    border: 1px solid;
    border-radius: 0.25rem;
    text-align: left;
    position: relative;
    &.open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }
    &.focused {
        box-shadow: 0 0 5px blue;
    }
}

/* Input Section (upper section) */
.rj-input-section {
    display: flex;
    justify-content: space-between;
}

/* Selected Items */
.rj-selected-items {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding: 0.5rem;
}

/* Single & Multiple selection Wrappers */
.rj-single-item,
.rj-multiple-items {
    flex: 1 0 auto;
}

.rj-multiple-items {
    max-width: 95%;
}

/* Multiple Selection List */
.rj-multiple-items-list {
    margin: -0.5rem 0.5rem -0.5rem -0.5rem;
    padding: 0;
    list-style-type: none;
    display: flex;
    flex-flow: row wrap;
}

/* Mutiple Selecting Item 'tag' */
.rj-multiple-item {
    border: 1px dashed;
    padding: 0.25rem;
    margin: 0.25rem;
    background: #eee;
    display: flex;
    align-items: center;
    justify-content: flex-between;
    white-space: nowrap;

    .rj-clear-button {
        display: flex;
        align-items: center;
        justify-content: flex-between;
        cursor: pointer;
        margin-left: 0.5rem;
    }
}

/* Filter or Search box */
.rj-filter-input {
    width: 100%;
    flex: 1 1 100%;
    text-align: left;
    border: none;
    flex-shrink: auto;
    font-size: 1rem;
    padding: 0 0.25rem;
    &:focus {
        outline: none;
    }
}

/* Right hand action icons */
.rj-action-btn {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 0.5rem;
    cursor: pointer;
    transition: 0.3s;
}

.open .rj-action-btn {
    transform: rotate(180deg);
}

/* Dropdown Section */
.rj-dropdown-list {
    position: absolute;
    background: white;
    margin: 0;
    padding: 0;
    border-bottom: 1px solid;
    border-left: 1px solid;
    border-right: 1px solid;
    border-bottom-left-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
    list-style-type: none;
    // max-height: 150px;
    overflow-y: auto;
    /* Needs to match the width of the parents border */
    left: -1px;
    right: -1px;
    z-index: 10;
}

/* Dropdown Section Item */
.rj-dropdown-item {
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    &:hover {
        background: #bbb;
    }
}

.rj-selected-item {
    background: #ddd;
}
.rj-highlighted-item {
    background: yellow;
}
</style>
