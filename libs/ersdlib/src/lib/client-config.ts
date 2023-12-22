export interface IClientConfig {
  serveV3: boolean;
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  hasExcelDownload: boolean;
}
