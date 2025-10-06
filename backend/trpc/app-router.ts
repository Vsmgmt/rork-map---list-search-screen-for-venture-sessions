// backend/trpc/app-router.ts
import { initTRPC } from "@trpc/server";
import { boardsRouter } from './routes/boards/get';
import { 
  getAllRegularUsersRoute,
  getRegularUserByIdRoute,
  createRegularUserRoute,
  updateRegularUserRoute,
  deleteRegularUserRoute,
  getUserStatsRoute,
  initUserProfileRoute
} from './routes/users/index';
import {
  getStatsRoute,
  getProUsersRoute,
  getProUserByIdRoute,
  getExtrasRoute,
  updateUserRoute,
  regenerateSeedDataRoute,
  getAllUsersRoute,
  seedDataRoute,
  clearDataRoute,
  getDataStatsRoute,
  createProUsersRoute
} from './routes/admin/index';
import {
  createBookingRoute,
  getBookingsRoute,
  getBookingByIdRoute,
  updateBookingRoute,
  exportAllBookingsRoute
} from './routes/bookings/index';
import {
  getConversationsRoute,
  getMessagesRoute,
  sendMessageRoute,
  createConversationRoute,
  markAsReadRoute
} from './routes/messages/index';

const t = initTRPC.create();
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  boards: boardsRouter,
  users: router({
    getAllRegular: getAllRegularUsersRoute,
    getRegularById: getRegularUserByIdRoute,
    createRegular: createRegularUserRoute,
    updateRegular: updateRegularUserRoute,
    deleteRegular: deleteRegularUserRoute,
    getStats: getUserStatsRoute,
    initProfile: initUserProfileRoute,
  }),
  admin: router({
    getStats: getStatsRoute,
    getProUsers: getProUsersRoute,
    getProUserById: getProUserByIdRoute,
    getExtras: getExtrasRoute,
    updateUser: updateUserRoute,
    regenerateSeedData: regenerateSeedDataRoute,
    getAllUsers: getAllUsersRoute,
    seedData: seedDataRoute,
    clearData: clearDataRoute,
    getDataStats: getDataStatsRoute,
    createProUsers: createProUsersRoute,
  }),
  bookings: router({
    create: createBookingRoute,
    getAll: getBookingsRoute,
    getById: getBookingByIdRoute,
    update: updateBookingRoute,
    exportAll: exportAllBookingsRoute,
  }),
  messages: router({
    getConversations: getConversationsRoute,
    getMessages: getMessagesRoute,
    send: sendMessageRoute,
    createConversation: createConversationRoute,
    markAsRead: markAsReadRoute,
  }),
});
export type AppRouter = typeof appRouter;
