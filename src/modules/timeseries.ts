import { createAction } from 'redux-actions';
import { message } from 'antd';
import { Dispatch, Action, AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import {
  GetTimeSeriesMetadataDTO,
  TimeSeriesUpdate,
  IdEither,
} from '@cognite/sdk';
import { fetchEvents } from './events';
import { RootState } from '../reducers';
import { sdk } from '../index';
import { arrayToObjectById, checkForAccessPermission } from '../utils/utils';
import { trackUsage } from '../utils/metrics';
import { setTimeseriesId } from './app';

// Constants
export const SET_TIMESERIES = 'timeseries/SET_TIMESERIES';
export const REMOVE_ASSET_FROM_TIMESERIES =
  'timeseries/REMOVE_ASSET_FROM_TIMESERIES';

interface SetTimeseriesAction extends Action<typeof SET_TIMESERIES> {
  payload: { items: GetTimeSeriesMetadataDTO[] };
}
interface RemoveAssetAction
  extends Action<typeof REMOVE_ASSET_FROM_TIMESERIES> {
  payload: { timeseriesId: number };
}
type TimeseriesAction = SetTimeseriesAction | RemoveAssetAction;

// Functions
export function fetchTimeseries(ids: IdEither[]) {
  return async (dispatch: Dispatch<SetTimeseriesAction>) => {
    const results = await sdk.timeseries.retrieve(ids);
    dispatch({ type: SET_TIMESERIES, payload: { items: results } });
  };
}
export function fetchTimeseriesForAssetId(assetId: number) {
  return async (dispatch: Dispatch<SetTimeseriesAction>) => {
    trackUsage('Timeseries.fetchTimeseriesForAssetId', {
      assetId,
    });
    const results = await sdk.timeseries.list({
      assetIds: [assetId],
      limit: 1000,
    });
    dispatch({ type: SET_TIMESERIES, payload: { items: results.items } });
  };
}
export function fetchAndSetTimeseries(timeseriesId: number, redirect = false) {
  return async (dispatch: ThunkDispatch<any, any, AnyAction>) => {
    const results = await sdk.timeseries.retrieve([{ id: timeseriesId }]);
    dispatch({ type: SET_TIMESERIES, payload: { items: results } });
    dispatch(setTimeseriesId(timeseriesId, redirect));
  };
}
let searchTimeseriesId = 0;
export function searchTimeseries(query: string, assetId?: number) {
  return async (dispatch: Dispatch<SetTimeseriesAction>) => {
    trackUsage('Timeseries.fetchTimeseriesForAssetId', {
      assetId,
      query,
    });
    searchTimeseriesId += 1;
    const id = searchTimeseriesId;
    const results = await sdk.timeseries.search({
      filter: {
        ...(assetId && { assetIds: [assetId] }),
      },
      limit: 1000,
      search: { query },
    });
    if (searchTimeseriesId === id) {
      dispatch({
        type: SET_TIMESERIES,
        payload: { items: results },
      });
      searchTimeseriesId = 0;
    }
  };
}

export const removeAssetFromTimeseries = (
  timeseriesId: number,
  assetId: number
) => async (
  dispatch: ThunkDispatch<any, void, AnyAction>,
  getState: () => RootState
) => {
  if (
    !checkForAccessPermission(
      getState().app.groups,
      'timeSeriesAcl',
      'WRITE',
      true
    )
  ) {
    return;
  }
  trackUsage('Timeseries.removeAssetFromTimeseries', {
    assetId,
    timeseriesId,
  });
  await sdk.timeseries.update([
    {
      id: timeseriesId,
      update: {
        assetId: { setNull: true },
      },
    },
  ]);
  dispatch({
    type: REMOVE_ASSET_FROM_TIMESERIES,
    payload: { timeseriesId },
  });

  message.info(`Removed 1 timeseries from asset.`);
};

export const addTimeseriesToAsset = (
  timeseriesIds: number[],
  assetId: number
) => async (
  dispatch: ThunkDispatch<any, void, AnyAction>,
  getState: () => RootState
) => {
  if (
    !checkForAccessPermission(
      getState().app.groups,
      'timeSeriesAcl',
      'WRITE',
      true
    )
  ) {
    return;
  }
  trackUsage('Timeseries.addTimeseriesToAsset', {
    assetId,
    timeseriesIds,
  });

  const changes = timeseriesIds.map(id => ({
    id,
    update: { assetId: { set: assetId } },
  }));
  await sdk.timeseries.update(changes);

  message.info(`Mapped ${timeseriesIds.length} timeseries to asset.`);

  setTimeout(() => {
    dispatch(fetchTimeseriesForAssetId(assetId));
    dispatch(fetchEvents(assetId));
  }, 1000);
};

export const editTimeseries = (
  timeseriesId: number,
  update: TimeSeriesUpdate
) => async (
  dispatch: Dispatch<SetTimeseriesAction>,
  getState: () => RootState
) => {
  if (
    !checkForAccessPermission(
      getState().app.groups,
      'timeSeriesAcl',
      'WRITE',
      true
    )
  ) {
    return;
  }
  trackUsage('Timeseries.updateTimeseries', {
    id: timeseriesId,
  });

  const updatedTimeseries = await sdk.timeseries.update([update]);
  dispatch({
    type: SET_TIMESERIES,
    payload: { items: updatedTimeseries },
  });
};

// Reducer
export interface TimeseriesState {
  timeseriesData: { [key: number]: GetTimeSeriesMetadataDTO };
}
const initialState: TimeseriesState = { timeseriesData: {} };

export default function timeseries(
  state = initialState,
  action: TimeseriesAction
): TimeseriesState {
  switch (action.type) {
    case SET_TIMESERIES: {
      const { items } = action.payload;
      return {
        ...state,
        timeseriesData: {
          ...state.timeseriesData,
          ...arrayToObjectById(items),
        },
      };
    }

    case REMOVE_ASSET_FROM_TIMESERIES: {
      const { timeseriesId } = action.payload;
      const { timeseriesData } = state;
      delete timeseriesData[timeseriesId];
      return {
        ...state,
        timeseriesData,
      };
    }
    default:
      return state;
  }
}

// Action creators
const setTimeseries = createAction(SET_TIMESERIES);

export const actions = {
  setTimeseries,
};

// Selectors
export const selectTimeseries = (state: RootState) =>
  state.timeseries || { items: [] };
