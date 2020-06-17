<template>
    <div class="modal is-active">
        <form action="#" @submit.prevent="submitForm">
            <div class="modal-background"></div>
            <div class="modal-card">
                <header class="modal-card-head">
                    <p class="modal-card-title">{{ $t('modal.login.title') }}</p>
                    <a class="delete" aria-label="close" @click="closeModal"></a>
                </header>
                <section class="modal-card-body">
                    <h5 class="title is-5">{{ $t('modal.login.subtitle') }}</h5>
                    <div class="field is-horizontal">
                        <div class="field-label is-normal">
                            <label for="title" class="label">{{ $t('modal.login.fields.username.label') }}</label>
                        </div>
                        <div class="field-body"><div class="field"><div class="control">
                            <input type="text" name="title" id="title" class="input" required
                                   :placeholder="$t('modal.login.fields.username.placeholder')" autocomplete="username" v-model="login.username">
                        </div></div></div>
                    </div>
                    <div class="field is-horizontal">
                        <div class="field-label is-normal">
                            <label for="password" class="label">{{ $t('modal.login.fields.password.label') }}</label>
                        </div>
                        <div class="field-body"><div class="field"><div class="control">
                            <input type="password" name="password" id="password" class="input" required
                                   :placeholder="$t('modal.login.fields.password.placeholder')" autocomplete="current-password" v-model="login.password">
                        </div></div></div>
                    </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button is-success" :class="{'is-loading': loading}" type="submit">{{ $t('modal.login.submit') }}</button>
                </footer>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'

    export default Vue.extend({
        name: 'LoginModal',

        data() {
            return {
                login: {
                    username: '',
                    password: ''
                },
                loading: false
            }
        },

        methods: {
            submitForm() {
                this.loading = true;
                this.$auth.loginWith('local', { data: this.login }).then(res => {
                    this.loading = false;
                    this.closeModal();
                });
            },
            closeModal() {
                this.$emit('close');
            }
        }
    });
</script>

<style lang="scss" scoped>
    .field-body {
        flex-grow: 4;
    }
</style>
