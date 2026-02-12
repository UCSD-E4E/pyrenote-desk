import { GroupBase, StylesConfig } from "react-select";

export const dropdownStyles: StylesConfig<any, false, GroupBase<any>> = {
	control: (base: any) => ({
		...base,
		position: "absolute",
		zIndex: "10",
		backgroundColor: "rgba(0, 0, 0, 0.2)",
		":hover": {
			backgroundColor: "rgba(0, 0, 0, 0.8)"
		},
		padding: "0px 0px 0px 4px",
		margin: "0px 0px",
		borderRadius: "4px",
		maxWidth: "50%",
		minWidth: "50%",
		minHeight: "20px",
	}),
	menu: (base: any) => ({
		...base,
		zIndex: "1000",
		borderRadius: "8px",
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		color: "white",
		marginTop: '24px',
		width: '50%',
		left: '40px',
	}),
	option: (base: any, state: any) => ({
		...base,
		display: "flex",
		flexDirection: "column",
		zIndex: "1000",
		padding: "0px 15px",  // padding inside each option
		color: "white",
		":hover": {
			backgroundColor: "rgba(255, 255, 255, 0.5)"
		},
		backgroundColor: state.selected ? "rgba(0,0,255,0.3)" : "transparent",
		fontSize: '12px',
		height: '20px',
		justifyContent: 'center',
	}),
	singleValue: (base: any) => ({
		...base,
		fontSize: "12px",
		color: "white",
		padding: "0px",
		margin: "0px",
	}),
	indicatorSeparator: (base: any) => ({
		...base,
		marginBottom: "4px",
		marginTop: "4px",
		flex: "1",
	}),
	dropdownIndicator: (base: any) => ({
		...base,
		padding: "0px",
		margin: "0px",
		width: '20px',
		height: '20px',
		flex: "0",
	}),
	valueContainer: (base: any) => ({
		...base,
		margin: '0 0',
		padding: '0 0',
	}),
	input: (base: any) => ({
		...base,
		margin: '0 0',
		padding: '0 0',
		color: 'white',
		fontSize: '12px',
	})
}