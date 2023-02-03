import hotelRepository from "@/repositories/hotel-repository";

async function getHotels() {
    const result = await hotelRepository.findHotels();
    return result;
}

const hotelsService = {
    getHotels,
}

export default hotelsService;
