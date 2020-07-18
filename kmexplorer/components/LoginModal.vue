<template>
  <div class="modal" :class="{'is-active': active}">
    <form action="#" @submit.prevent="submitForm">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header>
          <div class="modal-card-head">
            <a
              class="modal-card-title"
              :class="{'is-active' : mode === 'login' }"
              @click="mode='login'"
            >{{ $t('modal.login.title') }}</a>
            <a
              class="modal-card-title"
              :class="{'is-active' : mode === 'signup' }"
              @click="mode='signup'"
            >{{ $t('modal.signup.title') }}</a>
            <a class="delete" aria-label="close" @click="closeModal"></a>
          </div>
        </header>
        <section class="modal-card-body" v-if="mode === 'login'">
          <h5 class="title is-5">{{ $t('modal.login.subtitle') }}</h5>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="title" class="label">{{ $t('modal.login.fields.username.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field has-addons">
                <div class="control">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    class="input"
                    required
                    :placeholder="$t('modal.login.fields.username.placeholder')"
                    autocomplete="username"
                    v-model="login.username"
                  />
                </div>
                <div class="control is-expanded">
                  <div class="button is-static">{{`@${apiHost}`}}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="password" class="label">{{ $t('modal.login.fields.password.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    class="input"
                    required
                    :placeholder="$t('modal.login.fields.password.placeholder')"
                    autocomplete="current-password"
                    v-model="login.password"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="modal-card-body" v-if="mode === 'signup'">
          <h5 class="title is-5">{{ $t('modal.signup.subtitle') }}</h5>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="title" class="label">{{ $t('modal.signup.fields.username.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field has-addons">
                <div class="control">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    class="input"
                    required
                    :placeholder="$t('modal.signup.fields.username.placeholder')"
                    autocomplete="username"
                    v-model="login.username"
                  />
                </div>
                <div class="control is-expanded">
                  <div class="button is-static">{{`@${apiHost}`}}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="password" class="label">{{ $t('modal.signup.fields.password.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    class="input"
                    required
                    :placeholder="$t('modal.signup.fields.password.placeholder')"
                    autocomplete="current-password"
                    v-model="login.password"
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
              >{{ $t('modal.signup.fields.password_confirmation.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="password"
                    name="password_confirmation"
                    id="password_confirmation"
                    class="input"
                    required
                    :placeholder="$t('modal.signup.fields.password_confirmation.placeholder')"
                    autocomplete="current-password"
                    v-model="login.password_confirmation"
                  />
                </div>
                <p
                  class="help is-danger"
                  v-if="passwordNotEquals()"
                >{{ $t('modal.signup.passwords_mismatch') }}</p>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-label is-normal">
              <label for="title" class="label">{{ $t('modal.signup.fields.email.label') }}</label>
            </div>
            <div class="field-body">
              <div class="field">
                <div class="control">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    class="input"
                    required
                    :placeholder="$t('modal.signup.fields.email.placeholder')"
                    autocomplete="email"
                    v-model="login.email"
                  />
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
          >{{ $t(mode === 'login' ? 'modal.login.submit' : 'modal.signup.submit') }}</button>
        </footer>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "LoginModal",

  props: ["active"],

  data() {
    return {
      apiHost: process.env.API_HOST,
      login: {
        username: "",
        password: ""
      },
      mode: "login",
      loading: false
    };
  },

  methods: {
    passwordNotEquals() {
      return (
        this.mode === "signup" &&
        this.login.password_confirmation &&
        this.login.password !== this.login.password_confirmation
      );
    },
    async submitForm() {
      this.loading = true;
      if (this.mode === "signup") {
        let signup = this.login;
        signup.login = this.login.username;
        await this.$axios.post("/api/users", signup);
        this.loading = false;
        this.closeModal();
      }
      this.$auth.loginWith("local", { data: this.login }).then(async _res => {
        this.$emit("login");
        // Fetch user
        // const { data } = await this.$axios.get('/api/myaccount');
        // this.$auth.setUser(data);
        this.loading = false;
        this.closeModal();
      }).catch(err => {
        console.error(err);
        this.loading = false;
      });
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
.control.is-expanded .button {
  width: 100%;
}
</style>
