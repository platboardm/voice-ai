import React from 'react';
import { Dropdown } from '@/app/components/carbon/dropdown';

const Roles = ['super admin', 'admin', 'writer', 'reader'];

export function ProjectRoleDropdown(props: {
  projectRole: string;
  setProjectRoleId: (role: string) => void;
}) {
  return (
    <Dropdown
      id="project-role-dropdown"
      titleText="Project Role"
      label="Select a project role"
      items={Roles}
      selectedItem={props.projectRole || null}
      itemToString={(item: string | null) =>
        item ? item.charAt(0).toUpperCase() + item.slice(1) : ''
      }
      onChange={({ selectedItem }) => {
        if (selectedItem) props.setProjectRoleId(selectedItem);
      }}
    />
  );
}
