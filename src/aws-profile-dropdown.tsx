import { List } from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { loadSharedConfigFiles } from "@smithy/shared-ini-file-loader";
import { useEffect } from "react";

interface Props {
  onProfileSelected?: VoidFunction;
}

export default function AWSProfileDropdown({ onProfileSelected }: Props) {
  const [selectedProfile, setSelectedProfile] = useCachedState<string>("aws_profile");
  const profileOptions = useProfileOptions();

  useEffect(() => {
    const isSelectedProfileInvalid =
      selectedProfile && !profileOptions.some((profile) => profile.name === selectedProfile);

    if (!selectedProfile || isSelectedProfileInvalid) {
      setSelectedProfile(profileOptions[0]?.name);
    }
  }, [profileOptions]);

  useEffect(() => {
    if (selectedProfile) {
      process.env.AWS_PROFILE = selectedProfile;
    } else {
      delete process.env.AWS_PROFILE;
    }

    if (selectedProfile) {
      process.env.AWS_REGION = profileOptions.find((profile) => profile.name === selectedProfile)?.region;
    }

    onProfileSelected?.();
  }, [selectedProfile]);

  if (!profileOptions || profileOptions.length < 2) {
    return null;
  }

  return (
    <List.Dropdown tooltip="Select AWS Profile" value={selectedProfile} onChange={setSelectedProfile}>
      {profileOptions.map((profile) => (
        <List.Dropdown.Item key={profile.name} value={profile.name} title={profile.name} />
      ))}
    </List.Dropdown>
  );
}

type ProfileOption = {
  name: string;
  region?: string;
  source_profile?: string;
};

const useProfileOptions = (): ProfileOption[] => {
  const { data: configs = { configFile: {}, credentialsFile: {} } } = useCachedPromise(loadSharedConfigFiles);
  const { configFile, credentialsFile } = configs;

  const profileOptions =
    Object.keys(configFile).length > 0 ? Object.entries(configFile) : Object.entries(credentialsFile);

  return profileOptions.map(([name, config]) => {
    const includeProfile = configFile[name]?.include_profile;
    const region =
      configFile[name]?.region ||
      credentialsFile[name]?.region ||
      (includeProfile && configFile[includeProfile]?.region);

    return { ...config, region, name };
  });
};
