import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { prisma } from "@/config";
import {
  createUser,
  createHotel,
  createEnrollmentWithAddress,
  createTicketHotelIncluded,
  createTicketHotelNotIncluded,
  createTicketRemote,
  createTicket,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 if there is no enrollment", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      await createHotel();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 if there is no ticket", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      await createEnrollmentWithAddress(user);

      await createHotel();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when there are no hotels", async () => {
      const user = await createUser();
      
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 if hotel is not included", async () => {
      const user = await createUser();
      
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelNotIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 if event is remote", async () => {
      const user = await createUser();
      
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 if there is no payment", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      await createHotel();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 200 and array of hotels", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString()
        }
      ]);
    });
  });
});

describe("GET /hotels/:hotelID", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get(`/hotels/${1}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 if there is no enrollment", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      await createHotel();
      const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 if there is no ticket", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      await createEnrollmentWithAddress(user);

      await createHotel();
      const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    
    it("should respond with status 404 if hotel does not exist", async () => {
      const user = await createUser();
      
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
      expect(response.body).toEqual({});
    });

    it("should respond with status 402 if hotel is not included", async () => {
      const user = await createUser();
      
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelNotIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 if event is remote", async () => {
      const user = await createUser();
      
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 if there is no payment", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      await createHotel();
      const response = await server.get(`/hotels/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 200 and array of rooms", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();

      const room = await prisma.room.create({
        data: {
          name: "602",
          capacity: 4,
          hotelId: hotel.id,
        }
      });

      const response = await server.get(`/hotels/${hotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
          Rooms: [{
            id: room.id,
            name: room.name,
            capacity: room.capacity,
            hotelId: hotel.id,
            createdAt: room.createdAt.toISOString(),
            updatedAt: room.updatedAt.toISOString(),
          }]
        }
      ]);
    });

    it("should respond with status 200 and empty array if there are no rooms", async () => {
      const user = await createUser();     
      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketHotelIncluded();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const hotel = await createHotel();

      const response = await server.get(`/hotels/${hotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
          Rooms: []
        }
      ]);
    });
  });
});
