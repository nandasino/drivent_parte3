import hotelsService from "@/services/hotels-service";
import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
   try {
      const result = await hotelsService.getHotels(Number(userId));
      res.status(httpStatus.OK).send(result);
    } catch (error) {
      if (error.name === "PaymentRequiredError") {
        return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
      }
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
}