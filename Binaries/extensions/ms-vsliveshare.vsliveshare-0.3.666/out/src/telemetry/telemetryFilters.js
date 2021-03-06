"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This filter ensures that only one telemetry event with the given
// event name and set of properties is ever sent. This is useful in
// situations where the same event can be sent many times; e.g. exceptions.
class SendOnceFilter {
    constructor(eventName, distinctProperties = []) {
        this.eventName = eventName;
        this.distinctProperties = distinctProperties;
        this.sentEventsProperties = [];
    }
    shouldSend(eventName, properties, measures) {
        if (eventName === this.eventName) {
            for (const sentProperties of this.sentEventsProperties) {
                if (this.propertySubsetsEqual(properties, sentProperties)) {
                    return false;
                }
            }
            this.sentEventsProperties.push(this.createPropertySubset(properties));
        }
        return true;
    }
    reset() {
        this.sentEventsProperties = [];
    }
    createPropertySubset(properties) {
        const propertySubset = {};
        for (const p of this.distinctProperties) {
            propertySubset[p] = properties[p];
        }
        return propertySubset;
    }
    propertySubsetsEqual(properties1, properties2) {
        for (const p of this.distinctProperties) {
            if (properties1[p] !== properties2[p]) {
                return false;
            }
        }
        return true;
    }
}
exports.SendOnceFilter = SendOnceFilter;

//# sourceMappingURL=telemetryFilters.js.map
