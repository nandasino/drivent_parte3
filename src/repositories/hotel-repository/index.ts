import { prisma } from "@/config";

async function findHotels() {
    return prisma.hotel.findMany();
}

async function findHotelById(hotelId: number) {
    return prisma.hotel.findFirst({
        where: {
            id: hotelId,
        }
    });
}

async function findHotelRooms(hotelId: number) {
    return prisma.hotel.findMany({
        where: {
            id: hotelId,
        },
        include: {
            Rooms: true,
        }
    });
}


const hotelRepository = {
    findHotels,
    findHotelRooms,
    findHotelById,
};

export default hotelRepository;
