
import * as repository from "../repositories/profile.repository.js";

import AppError from "../utils/AppError.js";
import STATUS_CODES from "../constants/statusCodes.js";



export const createProfileService = async (
    supabaseUserId,
    profileData
) => {

    const account = await repository.findAccountBySupabaseUserId(
        supabaseUserId
    );

    if (!account) {
        throw new AppError(
            "Account not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    const existing = await repository.findProfileByName(
        account.id,
        profileData.fullName
    );

    if (existing) {
        throw new AppError(
            "Profile with this name already exists",
            STATUS_CODES.CONFLICT
        );
    }

    return repository.createProfile({
        accountId: account.id,
        ...profileData
    });
};

export const getProfilesService = async (supabaseUserId) => {

    const account = await repository.findAccountBySupabaseUserId(
        supabaseUserId
    );

    if (!account) {
        throw new AppError(
            "Account not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    return repository.findAllProfiles(account.id);
};

export const getProfileByIdService = async (
    id,
    supabaseUserId
) => {

    const account =
        await repository.findAccountBySupabaseUserId(
            supabaseUserId
        );

    if (!account) {
        throw new AppError(
            "Account not found",
            STATUS_CODES.NOT_FOUND
        );
    }

    const profile = await repository.findProfileById(
        id,
        account.id
    );

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
    supabaseUserId,
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