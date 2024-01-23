import { MdCheckBox, MdIndeterminateCheckBox, MdOutlineCheckBoxOutlineBlank } from "react-icons/md";

export default function Checkbox({
    checked,
    intermediate
}: {
    checked: boolean | undefined | unknown;
    intermediate?: boolean | undefined | unknown;
}) {
    if (intermediate) return <MdIndeterminateCheckBox size={22} />;
    if (checked) return <MdCheckBox size={22} />;
    return <MdOutlineCheckBoxOutlineBlank size={22} />;
}

Checkbox.defaultProps = {
    intermediate: false
};
