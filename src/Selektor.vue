<template>
    <div
        class="rj-combobox"
        :focused="current.matches('focused')"
        :class="{
            open: current.matches('focused.opened'),
            closed: current.matches('focused.closed'),
            focused: current.matches('focused'),
            unfocused: current.matches('unfocused'),
            filtered: context.filter.length,
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
                    <ul v-if="context.value.size" class="rj-multiple-items-list">
                        <slot
                            v-for="val in context.value"
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
                    class="rj-filter-input"
                    @focus="open"
                    @blur="close"
                    :required="current.matches('unfocused') && required && empty"
                    :readonly="!searchable && !current.matches('unfocused')"
                    :placeholder="empty ? placeholder : ''"
                    @keydown="handleKeydown"
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
            <ul
                v-if="current.matches('focused.opened')"
                class="rj-dropdown-list"
            >
                <slot
                    v-for="(option, idx) in context.options"
                    name="option"
                    :option="option"
                    :select="_ => selectOption(option)"
                    :highlighted="context.highlightIndex === idx"
                    :selected="multiple && context.value.has(option) || Object.is(option, context.value)"
                >
                    <li
                        class="rj-dropdown-item"
                        ref="dropdownOption"
                        :class="{
                        'rj-selected-item': multiple && context.value.has(option) || Object.is(option, context.value),
                        'rj-highlighted-item': context.highlightIndex === idx
                    }"
                        :key="keyFunction(option)"
                        @click="selectOption(option)"
                    >{{ labelFunction(option) }}</li>
                </slot>

                <li v-if="context.options.length === 0" class="rj-dropdown-item rj-no-options" key="no-matches">No matches Found</li>
            </ul>
    </div>
</template>

<script>
import { interpret } from "xstate";
import initComboboxMachine from "./comboboxMachine";
import { hideOnClickOutside } from "./events";

import ArrowIcon from "./icons/ArrowIcon.vue";
import CloseIcon from "./icons/CloseIcon.vue";

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
        required: Boolean,

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

        // Dropdown scroll behavior
        scrollOptions: {
            type: Object,
            default: () => ({ block: "center" })
        },

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
        empty() {
            return this.multiple ? this.context.value.size === 0 : !this.context.value
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
        this.comboboxService.stop();
    },

    data() {
        const comboboxMachine = initComboboxMachine.bind(this)({});

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
            }
        },

        // Blur Event
        blur() {
            this.send({ type: "BLUR" });
        },

        close() {
            this.send({ type: "CLOSE" });
        },

        open() {
            this.send({ type: "OPEN" });
        },

        clear() {
            this.send({ type: "CLEAR" });
        },

        selectOption(value) {
            // ensure its an available option
            if (
                !this.context.options.some(
                    option =>
                        this.keyFunction(option) === this.keyFunction(value)
                )
            ) {
                return;
            }

            this.send({ type: 'SELECT', value });
        },

        removeOption(value) {
            this.send({ type: "REMOVE", value });
        },

        setFilter(event) {
            this.send({ type: "FILTER", value: event.target.value });
        },

        handleKeydown(e) {
            const keysICareAbout = {
                8: "delete",
                9: "tab",
                16: 'shift',
                17: 'ctrl',
                18: 'alt',
                91: 'left-command',
                93: 'right-command',
                13: "enter",
                27: "esc",
                38: "up",
                40: "down"
            };

            if ([16,17,18, 91, 93].includes(e.which)) {
                // no action for modifier keys
                return
            }

            if (!(e.which in keysICareAbout)) {
                return this.focus();
            }

            const actions = {
                up: () => {
                    this.focus()
                    this.send({
                        type: "SET_HIGHLIGHT_INDEX",
                        value:
                            (Math.max(this.context.highlightIndex, 0) -
                                1 +
                                this.context.options.length) %
                            this.context.options.length
                    });

                },
                down: () => {
                    this.focus()
                    this.send({
                        type: "SET_HIGHLIGHT_INDEX",
                        value:
                            (this.context.highlightIndex +
                                1 +
                                this.context.options.length) %
                            this.context.options.length
                    });
                },
                delete: () => {
                    if (
                        this.current.matches("focused") &&
                        this.context.value.size
                    ) {
                        if (!this.context.filter.length) {
                            this.removeOption(
                                [...this.context.value][
                                    this.context.value.size - 1
                            ]
                        );
                        }
                    }
                },
                tab: () => {
                    if (this.current.matches("focused")) {
                        this.blur();
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
                    e.preventDefault()
                    if (this.current.matches("focused.opened")) {
                        this.selectOption(
                            this.context.options[this.context.highlightIndex]
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
    },

    watch: {
        value(newValue) {
            this.send({
                type: 'SET_VALUE',
                value: newValue
            })
        }
    }
};
</script>

<style lang="scss">
:root {
    // keyboard nav, highlighted colour
    --rj-colour-highlight: yellow;
    // outside border radius
    --rj-border-radius: 0.25rem;
    // max height when open
    --rj-dropdown-max-height: 150px;
    --rj-border: 1px solid;
    --rj-border-offset: -1px;
}

* {
    box-shadow: border-box;
}
/* Outer Wrapper */
.rj-combobox {
    border: var(--rj-border, 1px solid);
    border-radius: var(--rj-border-radius, 0.25rem);
    text-align: left;
    position: relative;
    &.open {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;

        .rj-action-btn {
            transform: rotate(180deg);
        }
    }

    &[focused] {
        box-shadow: 0 0 5px blue;
    }

    .rj {
        /* Input Section (upper section) */
        &-input-section {
            display: flex;
            justify-content: space-between;
        }

        /* Selected Items */
        &-selected-items {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            width: 100%;
            padding: 0.5rem;
        }

        /* Single & Multiple selection Wrappers */
        &-single-item,
        &-multiple-items {
            flex: 1 0 auto;
        }

        &-multiple-items {
            max-width: 95%;
        }

        /* Multiple Selection List */
        &-multiple-items-list {
            margin: -0.5rem 0.5rem -0.5rem -0.5rem;
            padding: 0;
            list-style-type: none;
            display: flex;
            flex-flow: row wrap;
        }

        /* Mutiple Selecting Item 'tag' */
        &-multiple-item {
            border: 1px dashed;
            padding: 0.25rem;
            margin: 0.25rem;
            background: #eee;
            display: flex;
            align-items: center;
            justify-content: flex-between;
            white-space: nowrap;
        }
        &-clear-button {
            display: flex;
            align-items: center;
            justify-content: flex-between;
            cursor: pointer;
            margin-left: 0.5rem;
        }

        /* Filter or Search box */
        &-filter-input {
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
        &-action-btn {
            display: flex;
            flex-flow: row wrap;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 0 0.5rem;
            cursor: pointer;
            transition: 0.3s;
        }

        /* Dropdown Section */
        &-dropdown-list {
            position: absolute;
            background: white;
            margin: 0;
            padding: 0;
            border-bottom: var(--rj-border, 1px solid);
            border-left: var(--rj-border, 1px solid);
            border-right: var(--rj-border, 1px solid);
            border-bottom-left-radius: var(--rj-border-radius, 0.25rem);
            border-bottom-right-radius: var(--rj-border-radius, 0.25rem);
            list-style-type: none;
            max-height: var(--rj-dropdown-max-height, 150px);
            overflow-y: auto;
            /* Needs to match the width of the parents border */
            left: var(--rj-border-offset, -1px);
            right: var(--rj-border-offset, -1px);
            z-index: 10;
        }

        /* Dropdown Section Item */
        &-dropdown-item {
            padding: 0.25rem 0.5rem;
            cursor: pointer;
            &:hover {
                background: #bbb;
            }
        }

        &-selected-item {
            background: #ddd;
        }
        &-highlighted-item {
            background: var(--rj-colour-highlight);
        }
    }
}
</style>
