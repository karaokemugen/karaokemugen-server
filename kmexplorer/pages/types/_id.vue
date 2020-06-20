<template>
  <div class="is-ancestor">
    <pagination :page="page" :last-page="total" @page="setPage"></pagination>

    <div class="tags" v-if="tags.content.length > 0">
      <tag
        v-for="tag in tags.content"
        :key="tag.tid"
        :icon="true"
        :type="type"
        :tag="tag"
        :i18n="tag.i18n"
        :showkaracount="true"
      />
    </div>
    <pagination :page="page" :last-page="total" @page="setPage"></pagination>

    <loading-nanami class="tile is-parent is-12" v-if="loading"></loading-nanami>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Tag from "~/components/Tag.vue";
import { tagTypesMap, tagTypes } from "../../assets/constants";
import LoadingNanami from "../../components/LoadingNanami";
import Pagination from "../../components/Pagination";

export default Vue.extend({
  name: "ListTag",
  components: {
    LoadingNanami,
    Tag,
    Pagination
  },

  data() {
    return {
      tagTypesMap,
      tags: {
        infos: { count: 0, from: 0, to: 0 },
        content: []
      },
      page: 1,
      loading: false,
      total: 1
    };
  },

  methods: {
    async setPage(e: number) {
	  if (this.tags.infos.to === this.tags.infos.count || this.loading) return;
	  console.log(e)
      this.page = e;
      this.loading = true;
      const { data } = await this.$axios.get(
        `/api/karas/tags/${tagTypes[this.type].type}`,
        {
          params: {
            from: (this.page - 1) * 200,
            size: 200
          }
        }
	  );
	  console.log(data)
      data.content = data.content.filter(
        tag => tag.karacount && Object.keys(tag.karacount).length > 0
      );
      this.tags = data;
      this.loading = false;
    }
  },

  validate({ params }) {
    return params.id && tagTypes[params.id];
  },

  async asyncData({ params, $axios, error, app }) {
    const { data } = await $axios
      .get(`/api/karas/tags/${tagTypes[params.id].type}`, {
        params: {
          from: 0,
          size: 200
        }
      })
      .catch(_err =>
        error({ statusCode: 404, message: app.i18n.t("tag.notfound") })
      );
    if (data)
      data.content = data.content.filter(
        tag => tag.karacount && Object.keys(tag.karacount).length > 0
      );
    return {
      tags: data,
      type: params.id,
      total: data.content.length > 0 && data.content[0].count / 200
    };
  },

  watch: {
    loading(now, _old) {
      if (now) this.$nuxt.$loading.start();
      else this.$nuxt.$loading.finish();
    }
  }
});
</script>
