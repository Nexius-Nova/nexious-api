import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that checks whether the current user owns the requested resource.
 * Expects the resource to be loaded and attached to `req.resource` by a prior interceptor/pipe,
 * or the route handler is responsible for manual ownership checks.
 *
 * Usage with a custom decorator:
 *   @SetMetadata('resourceOwnerField', 'userId')
 *   @UseGuards(OwnershipGuard)
 *
 * For simpler cases, controllers can use the helper directly.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins bypass ownership checks
    if (user.role === 'super_admin') return true;

    // Check if resource is pre-loaded on request
    const resource = request.resource;
    if (!resource) return true; // No resource to check — let the controller handle it

    const ownerField = this.reflector.get<string>(
      'resourceOwnerField',
      context.getHandler(),
    );
    const field = ownerField || 'userId';

    if (resource[field] !== user.userId) {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }
}
