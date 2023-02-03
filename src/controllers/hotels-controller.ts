import hotelsService from "@/services/hotels-service";
import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
   const result = await hotelsService.getHotels();
   res.status(httpStatus.OK).send(result);
}