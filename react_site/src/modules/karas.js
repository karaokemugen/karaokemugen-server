export const SET_KARAS = 'karas/SET_KARAS';
export const SET_PROGRESS = 'karas/SET_PROGRESS';

const initialState = {
  database: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_KARAS:
      return {
        ...state,
        database: action.karas
      };
    default:
      return state;
  }
};

export const setKaras = karas => dispatch =>
  new Promise(resolve => {
    dispatch({
      type: SET_KARAS,
      karas
    });
    //resolve(karas);
  });

export const establishKaras = () => dispatch => {
  dispatch(setKaras({}));
}