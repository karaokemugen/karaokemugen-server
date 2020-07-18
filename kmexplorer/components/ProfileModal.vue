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
              <div class="field has-addons">
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
                <div class="control">
                  <div class="input is-static">{{`@${apiHost}`}}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="nickname" class="label">{{ $t('modal.profile.fields.nickname.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    name="nickname"
                    id="nickname"
                    class="input"
                    required
                    autocomplete="nickname"
                    v-model="user.nickname"
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
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label
                for="password_confirmation"
                class="label"
              >{{ $t('modal.profile.fields.password_confirmation.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="password"
                    name="password_confirmation"
                    id="password_confirmation"
                    class="input"
                    :placeholder="$t('modal.profile.fields.password_confirmation.placeholder')"
                    autocomplete="password-confirmation"
                    v-model="user.password_confirmation"
                  />
                  <p
                    class="help is-danger"
                    v-if="passwordNotEquals()"
                  >{{ $t('modal.profile.passwords_mismatch') }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="email" class="label">{{ $t('modal.profile.fields.email.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    name="email"
                    id="email"
                    class="input"
                    required
                    :placeholder="$t('modal.profile.fields.email.placeholder')"
                    autocomplete="email"
                    v-model="user.email"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="url" class="label">{{ $t('modal.profile.fields.url.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    name="url"
                    id="url"
                    class="input"
                    :placeholder="$t('modal.profile.fields.url.placeholder')"
                    autocomplete="url"
                    v-model="user.url"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="bio" class="label">{{ $t('modal.profile.fields.bio.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    name="bio"
                    id="bio"
                    class="input"
                    :placeholder="$t('modal.profile.fields.bio.placeholder')"
                    autocomplete="bio"
                    v-model="user.bio"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal"></div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <button
                    type="button"
                    class="button is-danger"
                    @click="deleteUser"
                  >{{$t('modal.profile.delete')}}</button>
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
                <div class="control">
                  <div class="select">
                    <select v-model="user.series_lang_mode">
                      <option :value="-1">{{ $t('modal.profile.series_name.mode_no_pref') }}</option>
                      <option :value="0">{{ $t('modal.profile.series_name.original_name') }}</option>
                      <option :value="1">{{ $t('modal.profile.series_name.song_lang') }}</option>
                      <option :value="2">{{ $t('modal.profile.series_name.mode_admin') }}</option>
                      <option :value="3">{{ $t('modal.profile.series_name.user_lang') }}</option>
                      <option :value="4">{{ $t('modal.profile.series_name.force_lang_series') }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal" v-if="user.series_lang_mode === 4">
            <div class="field-label is-normal">
              <label
                for="title"
                class="label"
              >{{ $t('modal.profile.series_name.force_lang_series_main') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <div class="select">
                    <b-autocomplete
                      keep-first
                      open-on-focus
                      v-model="main_series_lang_name"
                      :data="getListLangsMain"
                      @select="option => user.main_series_lang = get3BCode(option)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal" v-if="user.series_lang_mode === 4">
            <div class="field-label is-normal">
              <label
                for="title"
                class="label"
              >{{ $t('modal.profile.series_name.force_lang_series_fallback') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <div class="select">
                    <b-autocomplete
                      keep-first
                      open-on-focus
                      v-model="fallback_series_lang_name"
                      :data="getListLangsFallback"
                      @select="option => user.fallback_series_lang = get3BCode(option)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-success"
            :class="{'is-loading': loading}"
            :disabled="passwordNotEquals()"
            type="submit"
          >{{ $t('modal.profile.submit') }}</button>
        </footer>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import languages from "@cospired/i18n-iso-languages";
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));
languages.registerLocale(require("@cospired/i18n-iso-languages/langs/fr.json"));

export default Vue.extend({
  name: "ProfileModal",

  props: ["active"],

  data() {
    return {
      apiHost: process.env.API_HOST,
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
      main_series_lang_name: "",
      fallback_series_lang_name: "",
      mode: "general",
      loading: false
    };
  },

  computed: {
    getListLangsMain() {
      return this.listLangs(this.main_series_lang_name || "");
    },

    getListLangsFallback() {
      return this.listLangs(this.fallback_series_lang_name || "");
    }
  },

  methods: {
    passwordNotEquals() {
      return (
        this.user.password_confirmation &&
        this.user.password !== this.user.password_confirmation
      );
    },
    listLangs(name) {
      let listLangs = [];
      for (let [key, value] of Object.entries(
        languages.getNames(languages.alpha3BToAlpha2(this.$i18n.locale))
      )) {
        listLangs.push(value);
      }
      return listLangs.filter(value =>
        value.toLowerCase().includes(name.toLowerCase())
      );
    },
    get3BCode(language: string) {
      return languages.getAlpha3BCode(
        language,
        languages.alpha3BToAlpha2(this.$i18n.locale)
      );
    },
    getUser() {
      if (this.$auth.loggedIn) this.user = this.$auth.user;
    },
    deleteUser() {
      this.$axios.delete('/api/myaccount');
      this.$emit("logout");
      this.closeModal();
    },
    async submitForm() {
      this.loading = true;
      let response = await this.$axios.put('/api/myaccount', this.user);
      // Refresh auth
      await this.$auth.setUserToken(response.data.data.token);
      this.loading = false;
      this.closeModal();
    },
    closeModal() {
      this.$emit("close");
    }
  },

  watch: {
    active(now, _old) {
      if (now) {
        this.getUser();
      }
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
.select select option {
  color: white;
}
</style>
