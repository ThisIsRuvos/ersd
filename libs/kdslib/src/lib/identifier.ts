import { ICodeableConcept } from './codeable-concept';

export interface IIdentifier {
  use?: string;
  type?: ICodeableConcept;
  system?: string;
  value?: string;
}
