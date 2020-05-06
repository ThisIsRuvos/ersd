export interface IClientConfig {
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  hasExcelDownload: boolean;
}
