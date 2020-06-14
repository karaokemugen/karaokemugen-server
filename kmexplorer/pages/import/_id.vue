<template>
  <div class="is-ancestor">
    <i18n path="kara.import.description" tag="div" class="description"></i18n>
    <div class="description">
      <i18n path="kara.import.attention" class="attention"></i18n>
      <i18n path="kara.import.check_in_progress"></i18n>
    </div>
    <div class="description">
      <ul>
        <li>
          <a href="http://docs.karaokes.moe">{{$t('kara.import.documentation_link')}}</a>
        </li>
        <li v-if="in_progress_songs_list">
          <a
            :href="in_progress_songs_list"
          >{{$t('kara.import.in_progress_link')}}</a>
        </li>
      </ul>
    </div>
    <article class="message is-info" v-if="base_license_name">
      <div class="message-header">
        <p>{{$t('kara.import.license_reminder', {name: base_license_name})}}</p>
      </div>
      <div class="message-body">
        <a v-if="base_license_link"
          :href="base_license_link"
        >{{$t('kara.import.license_link')}}</a>
      </div>
    </article>
    <div class="tile is-child is-5">
      <kara-edit :karaparam="karaparam"></kara-edit>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import KaraEdit from "../../components/KaraEdit.vue";

export default Vue.extend({
  name: "ImportKara",

  components: {
    KaraEdit
  },

  data() {
	  return {
		  base_license_name: process.env.BASE_LICENSE_NAME,
		  base_license_link: process.env.BASE_LICENSE_LINK,
		  in_progress_songs_list: process.env.IN_PROGRESS_SONGS_LIST
	  }
  },

  validate() {
	  return process.env.KM_IMPORT
  },

  async asyncData({ params, $axios, error, app }) {
    let result;
    let karaparam = {
      series: [],
      singers: [],
      misc: [],
      groups: [],
      songwriters: [],
      creators: [],
      authors: [],
      langs: [],
      songtypes: [],
      families: [],
      genres: [],
      platforms: [],
      origins: []
    };
    if (params.id) {
      result = await $axios
        .get(`/api/karas/${params.id}`)
        .catch(_err =>
          error({ statusCode: 404, message: app.i18n.t("kara.notfound") })
        );
      karaparam = result.data;
    }
    return { karaparam: karaparam };
  }
});
</script>

<style scoped lang="scss">
.description {
  margin: 1em;
  font-size: medium;

  .attention {
    font-weight: bolder;
  }
}
.tile .is-child {
  transition: width 0.8s;
}

.is-info {
  max-width: 1000px;
}
</style>