import { LoggerUtil } from 'src/utils/Logger';

export const ServiceHealth = function (constructor: any) {
  Object.getOwnPropertyNames(constructor.prototype).forEach((method) => {
    if (method !== 'isAlive' && method !== 'constructor') {
      const originalMethod = constructor.prototype[method];

      constructor.prototype[method] = async function (...args: any[]) {
        const isAlive = await this.isAlive();
        if (isAlive) {
          LoggerUtil.log(
            constructor.name + ' Service is alive',
            'Service Health',
          );
          return originalMethod.apply(this, args);
        } else {
          LoggerUtil.error(
            constructor.name + ' Service is not alive',
            'Service Health',
          );
          throw new Error('Service is not alive');
        }
      };

      Reflect.getMetadataKeys(originalMethod).forEach((key) => {
        const metadata = Reflect.getMetadata(key, originalMethod);
        Reflect.defineMetadata(key, metadata, constructor.prototype[method]);
      });
    }
  });

  return constructor;

  //   return construtor;
};
