import { createProfileSchema } from "../validators/profile.validator.js";
import { createProfileService } from "../services/profile.service.js";

import STATUS_CODES from "../constants/statusCodes.js";
import MESSAGES from "../constants/messages.js";

import {
    sendSuccess,
    sendError
} from "../utils/response.js";

export const createProfile = async (req, res, next) => {

    try {

        const validated =
            createProfileSchema.parse(req.body);

        const profile =
            await createProfileService(
                req.user.id,
                validated
            );

        return sendSuccess(
            res,
            STATUS_CODES.CREATED,
            MESSAGES.PROFILE_CREATED,
            profile
        );

    } catch (error) {

        next(error);

    }

};

export const getProfiles = async (req, res, next) => {

    try {

        const profiles =
            await getProfilesService(req.user.id);

        return sendSuccess(
            res,
            200,
            "Profiles fetched successfully",
            profiles
        );

    } catch (error) {

        next(error);

    }

};

export const getProfileById = async (req, res, next) => {

    try {

        const profile =
            await getProfileByIdService(
                req.params.id,
                req.user.id
            );

        return sendSuccess(
            res,
            200,
            "Profile fetched successfully",
            profile
        );

    } catch (error) {

        next(error);

    }

};

export const updateProfile = async (req, res, next) => {

    try {

        const validated =
            createProfileSchema.parse(req.body);

        const profile =
            await updateProfileService(
                req.params.id,
                req.user.id,
                validated
            );

        return sendSuccess(
            res,
            200,
            "Profile updated successfully",
            profile
        );

    } catch (error) {

        next(error);

    }

};

export const deleteProfile = async (req, res, next) => {

    try {

        await deleteProfileService(
            req.params.id,
            req.user.id
        );

        return sendSuccess(
            res,
            200,
            "Profile deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};