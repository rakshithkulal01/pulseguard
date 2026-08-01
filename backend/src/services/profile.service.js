
import * as repository from "../repositories/profile.repository.js";

import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";



export const createProfileService = async (
    accountId,
    profileData
) => {

    const existing = await repository.findProfileByName(
        accountId,
        profileData.fullName
    );

    if (existing) {
        throw new AppError(
    "Profile with this name already exists",
    STATUS_CODES.CONFLICT
);
}


    return repository.createProfile({
        accountId,
        ...profileData
    });
};


export const getProfilesService = async (accountId) => {
    return repository.findAllProfiles(accountId);
};

export const getProfileByIdService = async (id, accountId) => {

    const profile = await repository.findProfileById(id, accountId);

    if (!profile) {
      throw new AppError(
    "Profile not found",
    STATUS_CODES.NOT_FOUND
);
    }

    return profile;
};

export const updateProfileService = async (
    id,
    accountId,
    data
) => {

    const profile = await repository.findProfileById(id, accountId);

    if (!profile) {
        throw new AppError(
    "Profile not found",
    STATUS_CODES.NOT_FOUND
);
    }

    return repository.updateProfile(id, data);
};

export const deleteProfileService = async (
    id,
    accountId
) => {

    const profile = await repository.findProfileById(id, accountId);

    if (!profile) {
        throw new Error("Profile not found");
    }

    await repository.deleteProfile(id);

};