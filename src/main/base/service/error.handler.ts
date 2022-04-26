import { AxiosError } from 'axios';

export const axios_error_handler = (error: AxiosError): void => {
  if (error.response) {
    const err = {
      method: error.response.config.method,
      url: error.response.config.url,
      params: error.config.params,
      status: error.response.status,
      //data: error.response.data,
    }
    console.error(error.message, {err_msg: err});
  } else if (error.request) {
    console.error(error.message, {err_msg: error.request});
  } else {
    console.error(error.message);
  }
};