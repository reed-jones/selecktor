<template>
    <div id="app">
      <form @submit.prevent>
        <label for="combo-box1">Required Clearable - chosen: {{ value1 }}</label>
        <Selektor
            placeholder="Clearable!"
            id="combo-box1"
            name="combo-box1"
            v-model="value1"
            :options="options1"
            required
            clearable
        />

        <hr />

        <label for="combo-box2">Required Searchable - chosen: {{ value2 }}</label>
        <Selektor
            placeholder="Search..."
            id="combo-box2"
            name="combo-box2"
            v-model="value2"
            :options="options2"
            required
            searchable
        />

        <hr />

        <label for="combo-box3">Multiple Clearable Close-On-Select - chosen: {{ value3 }}</label>
        <Selektor
            id="combo-box3"
            name="combo-box3"
            v-model="value3"
            :options="options3"
            :close-on-select="true"
            multiple
            clearable
        />

        <hr />

        <label for="combo-box4">Multiple Required Searchable - chosen: {{ value4 }}</label>
        <Selektor
            id="combo-box4"
            name="combo-box4"
            v-model="value4"
            :options="options4"
            multiple
            required
            searchable
        />

        <hr />

        <!-- <label for="combo-box5">Combo Box Multiple Searchable - Slots</label>
        <Selektor
            id="combo-box5"
            name="combo-box5"
            v-model="values"
            :options="options"
            multiple
            searchable
        >
            <template #indicator="{ open, blur, focus }">
                <h1 @click="open ? blur() : focus()">{{ open ? 'CLOSE' : 'OPEN' }}</h1>
            </template>

            <template #tag="{ option, remove }">
                <h1 @click="remove">{{ option.key }}</h1>
            </template>

            <template #option="{ option, select }">
                <h1 @click="select" :key="option.value">{{ option.label }}</h1>
            </template>
        </Selektor> -->
        <button type="submit">Submit</button>
        </form>
    </div>
</template>

<script>
const options = [
    { key: "one", label: "Option One" },
    { key: "two", label: "Option Two" },
    { key: "three", label: "Option Three" },
    { key: "four", label: "Option Four" },
    { key: "five", label: "Option Five" },
    { key: "six", label: "Option Six" },
    { key: "seven", label: "Option Seven" },
    { key: "eight", label: "Option Eight" },
    { key: "nine", label: "Option Nine" },
    { key: "ten", label: "Option Ten" }
];

const options1 = options.slice()
const options2 = options.slice()
const options3 = options.slice()
const options4 = options.slice()
export default {
    data: _ => ({
        value1: options1[0],
        value2: null,
        value3: options3.slice(1,3),
        value4: null,

        options1,
        options2,
        options3,
        options4
    }),
};
</script>

<style>
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
