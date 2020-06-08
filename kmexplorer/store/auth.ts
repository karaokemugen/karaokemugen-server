import { Module, VuexModule, Mutation } from 'vuex-module-decorators'

@Module({
    name: 'auth',
    stateFactory: true,
    namespaced: true,
})
export default class Auth extends VuexModule {
    jwt = ''

    @Mutation
    setAuth(jwt) {
        this.jwt = jwt
    }
}
