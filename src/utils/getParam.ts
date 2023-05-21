
import * as _ from 'lodash';
export const getParam = (req: any) => {
    const param = _.extend({}, req.query, req.body, req.params);
    return param;
}