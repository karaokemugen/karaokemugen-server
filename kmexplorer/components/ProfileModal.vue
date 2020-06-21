<template>
  <div class="modal" :class="{'is-active': active}">
    <form action="#" @submit.prevent="submitForm">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header>
          <div class="modal-card-head">
            <a
              class="modal-card-title"
              :class="{'is-active' : mode === 'general' }"
              @click="mode='general'"
            >{{ $t('modal.profile.title') }}</a>
            <a
              class="modal-card-title"
              :class="{'is-active' : mode === 'series' }"
              @click="mode='series'"
            >{{ $t('modal.profile.series_name.label') }}</a>
            <a class="delete" aria-label="close" @click="closeModal"></a>
          </div>
        </header>
        <section class="modal-card-body" v-if="mode === 'general'">
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="title" class="label">{{ $t('modal.profile.fields.username.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    class="input is-static"
                    readonly
                    autocomplete="login"
                    v-model="user.login"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="password" class="label">{{ $t('modal.profile.fields.password.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    class="input"
                    :placeholder="$t('modal.profile.fields.password.placeholder')"
                    autocomplete="current-password"
                    v-model="user.password"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="modal-card-body" v-if="mode === 'series'">
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="title" class="label">{{ $t('modal.profile.series_name.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control"></div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-success"
            :class="{'is-loading': loading}"
            type="submit"
          >{{ $t('modal.profile.submit') }}</button>
        </footer>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ProfileModale",

  props: ["active"],

  data() {
    return {
      user: {
        login: "",
        nickname: "",
        password: "",
        bio: "",
        email: "",
        series_lang_mode: -1,
        main_series_lang: null,
        fallback_series_lang: null
      },
      mode: "general",
      loading: false
    };
  },

  created() {
    this.getUser();
  },

  methods: {
    async getUser() {
      let response = await this.$axios.get("/api/myaccount");
      response.data.password = "";
      this.user = response.data;
    },
    async submitForm() {
      this.loading = true;
      let response = await this.$axios.put("/api/myaccount", this.user);
      console.log(response.data.token);
      this.loading = false;
      this.closeModal();
    },
    closeModal() {
      this.$emit("close");
    }
  }
});
</script>

<style lang="scss" scoped>
.field-body {
  flex-grow: 4;
}
.is-active {
  color: #1dd2af;
}
</style>
