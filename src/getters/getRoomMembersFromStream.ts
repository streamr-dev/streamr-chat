import {
    PermissionAssignment,
    Stream,
    StreamPermission,
    UserPermissionQuery,
} from 'streamr-client'

export default async function getRoomMembersFromStream(
    stream: Stream
): Promise<string[]> {
    console.info('calling getRoomMembersFromStream')
    const members: string[] = []
    const memberPermissions: PermissionAssignment[] =
        await stream.getPermissions()

    const isUserPermissionQuery = (
        assignment: any
    ): assignment is UserPermissionQuery => {
        return assignment.user
    }

    for (const assignment of memberPermissions) {
        if (
            isUserPermissionQuery(assignment) &&
            assignment.permissions.includes(StreamPermission.SUBSCRIBE)
        ) {
            members.push(assignment.user)
        }
    }
    console.log('found members', members)
    return members
}
