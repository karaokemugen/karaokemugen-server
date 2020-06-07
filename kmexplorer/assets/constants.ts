export interface tagType {
    icon: string,
    class: string,
    type: number
}

export const tagTypes: {[key: string]: tagType} = {
    'series': {
        icon: 'tv',
        class: 'is-success',
        type: 1
    },
    'langs': {
        icon: 'globe',
        class: 'is-success',
        type: 5
    },
    'singers': {
        icon: 'microphone-alt',
        class: 'is-warning',
        type: 2
    },
    'songwriters': {
        icon: 'signature',
        class: 'is-warning',
        type: 8
    },
    'families': {
        icon: 'photo-video',
        class: 'is-info',
        type: 10
    },
    'origins': {
        icon: 'project-diagram',
        class: 'is-info',
        type: 11
    },
    'genres': {
        icon: 'chess',
        class: 'is-info',
        type: 12
    },
    'platforms': {
        icon: 'laptop',
        class: 'is-info',
        type: 13
    },
    'creators': {
        icon: 'chalkboard-teacher',
        class: 'is-white',
        type: 4
    },
    'authors': {
        icon: 'user-secret',
        class: 'is-white',
        type: 6
    },
    'groups': {
        icon: 'box',
        class: 'is-black',
        type: 9
    },
    'misc': {
        icon: 'tag',
        class: 'is-black',
        type: 7
    }
};