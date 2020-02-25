import Fetcher from '@/assets/js/fetcher';
import apiConfig from './access-groups-api.config';

const API_PREFIX = '/groups/api/v1/';
const getEndpoint = (endpoint, groupName) => `${endpoint}/${groupName}`;
export class Api {
  constructor() {
    this.fetcher = new Fetcher({ failoverOn: [302] });
  }
  async handleGet(getConfig, endpointArguments) {
    try {
      let endpoint = '';
      if (getConfig === true) {
        endpoint = getEndpoint(...endpointArguments);
      } else {
        endpoint = getConfig(...endpointArguments);
      }
      const result = await this.fetcher.fetch(endpoint);
      return await result.json();
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }
  async handleDelete(deleteConfig, endpointArguments) {
    try {
      let endpoint;
      if (deleteConfig === true) {
        endpoint = getEndpoint(...endpointArguments);
      } else {
        endpoint = deleteConfig(...endpointArguments);
      }
      return await this.fetcher.delete(endpoint);
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }
  async handlePost(
    postEndpointGetter,
    endpointArguments,
    postDataGetter,
    dataArguments
  ) {
    try {
      let endpoint = '';
      if (postEndpointGetter === true) {
        endpoint = getEndpoint(...endpointArguments);
      } else {
        endpoint = postEndpointGetter(...endpointArguments);
      }
      if (typeof postDataGetter === 'function') {
        return await this.fetcher.post(endpoint, postDataGetter(dataArguments));
      }
      return await this.fetcher.post(endpoint);
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }
  async handlePut(
    putEndpointGetter,
    endpointArguments,
    putDataGetter,
    dataArguments
  ) {
    try {
      let endpoint = '';
      if (putEndpointGetter === true) {
        endpoint = getEndpoint(...endpointArguments);
      } else {
        endpoint = putEndpointGetter(...endpointArguments);
      }
      return await this.fetcher.put(endpoint, putDataGetter(dataArguments));
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }
  async execute({ path, endpointArguments = [], dataArguments = {} }) {
    try {
      let [scope, restMethod] = path.split('/');
      if (!(restMethod in apiConfig[scope])) {
        throw new Error('unmapped path executed');
      }
      // Hold onto the original method for mapping use
      let mappedMethod = restMethod;

      // If the map method is not named as a REST method, the optional method 3rd argument in the REST getter will contain a REST method
      if (!['get', 'post', 'delete', 'put'].includes(mappedMethod)) {
        restMethod = apiConfig[scope][mappedMethod][2];
      }

      endpointArguments = [apiConfig[scope].endpoint, ...endpointArguments];
      switch (restMethod) {
        case 'get':
          return await this.handleGet(
            apiConfig[scope][restMethod],
            endpointArguments
          );
        case 'post':
          const [postEndpointGetter, postDataGetter] = apiConfig[scope][
            mappedMethod
          ];
          return await this.handlePost(
            postEndpointGetter,
            endpointArguments,
            postDataGetter,
            dataArguments
          );
        case 'put':
          const [putEndpointGetter, putDataGetter] = apiConfig[scope][
            mappedMethod
          ];
          return await this.handlePut(
            putEndpointGetter,
            endpointArguments,
            putDataGetter,
            dataArguments
          );
        case 'delete':
          return await this.handleDelete(
            apiConfig[scope][restMethod],
            endpointArguments
          );
        default:
          throw new Error(`Invalid method: ${restMethod}`);
      }
    } catch (e) {
      throw new Error(`Execute error: ${e.message}`);
    }
  }
}

export class MembersApi extends Api {
  constructor() {
    super();
    this.endpoint = `${API_PREFIX}members`;
  }

  async renew(groupName, memberUuid, groupExpiration) {
    try {
      const result = await this.fetcher.post(
        `${this.endpoint}/${groupName}/${memberUuid}/renew`,
        {
          group_expiration: groupExpiration,
        }
      );
      if (Number.isInteger(result)) {
        throw new Error(`Member post error: ${result}`);
      }
      return await result.json();
    } catch (e) {
      console.error(e.message);
      throw new Error(e.message);
    }
  }
}
