<template>
  <div id="app">
    <label for="combo-box1">Combo Box Single</label>
    <Selektor
      placeholder="Clearable!"
      id="combo-box1"
      name="combo-box1"
      v-model="value"
      :options="options"
      clearable
    />

    <hr>

    <label for="combo-box2">Combo Box Single Searchable</label>
    <Selektor
      placeholder="Search..."
      id="combo-box2"
      name="combo-box2"
      v-model="value"
      :options="options"
      searchable
    />

    <hr>

    <label for="combo-box3">Combo Box Multiple</label>
    <Selektor
      id="combo-box3"
      name="combo-box3"
      v-model="value"
      :options="options"
      multiple
      :close-on-select="true"
      clearable
    />

    <hr>

    <label for="combo-box4">Combo Box Multiple Searchable</label>
    <Selektor
      id="combo-box4"
      name="combo-box4"
      v-model="value"
      :options="options"
      multiple
      searchable
    />

    <hr>

    <label for="combo-box5">Combo Box Multiple Searchable - Slots</label>
    <Selektor
      id="combo-box5"
      name="combo-box5"
      v-model="value"
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
        <h1 @click="select">{{ option.label }}</h1>
      </template>
    </Selektor>

    <!-- <hr> -->
    <!-- <Selektor v-slot="{ select, remove, clear, open, close }">
      <div>test</div>
    </Selektor>-->
  </div>
</template>

<script>
export default {
  name: "App",

  data: _ => ({
    value: "",
    options: [
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
    ]
  })
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
