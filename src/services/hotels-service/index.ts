import { notFoundError, paymentRequiredError } from "@/errors";
import hotelRepository from "@/repositories/hotel-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { TicketStatus } from "@prisma/client";

async function getHotels(userId: number) {
    const enrollment =  await enrollmentRepository.findWithAddressByUserId(userId);
    if(!enrollment){
        throw notFoundError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
    if(!ticket) {
        throw notFoundError();  
    }
    if(!ticket.TicketType.includesHotel || ticket.TicketType.isRemote || ticket.status === TicketStatus.RESERVED ){
        throw paymentRequiredError();
    }

    const result = await hotelRepository.findHotels();

    return result;
}

async function getHotelRooms(userId: number, hotelId: number) {
    const enrollment =  await enrollmentRepository.findWithAddressByUserId(userId);
    if(!enrollment){
        throw notFoundError();
    }

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
    if(!ticket) {
        throw notFoundError();  
    }


    if(!ticket.TicketType.includesHotel || ticket.TicketType.isRemote || ticket.status === TicketStatus.RESERVED ){
        throw paymentRequiredError();
    }

    const hotel = await hotelRepository.findHotelById(hotelId);
    if(!hotel) {
        throw notFoundError(); 
    }

    const result = await hotelRepository.findHotelRooms(hotelId);

    return result;
}

const hotelsService = {
    getHotels,
    getHotelRooms,
}

export default hotelsService;
