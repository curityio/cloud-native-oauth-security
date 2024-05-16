/*
 *  Copyright 2024 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/*
 * The service class implements the main logic and applies authorization
 */
export class OrdersService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /*
     * Requests for collections filter on items the user is allowed to access
     */
    async listOrders(authorizer) {
        let result = await authorizer.canListOwnedOrders();
        if (result.allowed && result.condition.customerId) {
            return await this.repository.getOrdersForCustomer(result.condition.customerId);
        }
        result = await authorizer.canListOrdersForRegionalUsers();
        if (result.allowed && result.condition.region) {
            return await this.repository.getAllOrdersForRegion(result.condition.region);
        }
        return [];
    }
    /*
     * Requests for individual items return an access denied error when the user is unauthorized
     */
    async getOrderDetails(orderId, authorizer) {
        const order = await this.repository.getOrderDetails(orderId);
        if (!order) {
            return { error: `Order ${orderId} does not exist` };
        }
        const result = await authorizer.canViewOrder(order);
        if (result.allowed) {
            return { data: order };
        }
        return { error: `User is not authorized to access order ${orderId}` };
    }
}
