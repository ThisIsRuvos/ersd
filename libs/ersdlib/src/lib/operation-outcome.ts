import { IDomainResource } from './domain-resource';
import { ICodeableConcept } from './codeable-concept';

export interface IOperationOutcome extends IDomainResource {
  issue: [{
    severity: 'fatal'|'error'|'warning'|'information';
    code: string;
    details?: ICodeableConcept;
    diagnostics?: string;
    location?: string[];
    expression?: string[];
  }];
}
