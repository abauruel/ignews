import { NextApiRequest, NextApiResponse } from "next";

export default (resquest: NextApiRequest, response: NextApiResponse) => {
    const users = [
        {id: 1, name: 'Name'}
    ]
    return response.json(users)
}