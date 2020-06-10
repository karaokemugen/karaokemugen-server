import { Module, VuexModule, Mutation,  } from 'vuex-module-decorators'
import {Tag} from "../../src/lib/types/tag";

@Module({
    name: 'menubar',
    stateFactory: true,
    namespaced: true,
})
export default class MenuBar extends VuexModule {
    tag: {
        type: string,
        tag: Tag
    }

    search: string

    @Mutation
    setTag(tag) {
        this.tag = tag;
    }

    @Mutation
    setSearch(search) {
        this.search = search;
    }
}
