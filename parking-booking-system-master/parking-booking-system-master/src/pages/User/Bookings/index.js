import React, { useEffect, useState } from "react";
import { Table } from "antd";
import _ from "lodash";
import FirebaseDb from "../../../firebase";
import AlertBox from "../../../components/AlertMsg";
import { getFromLocal } from "../../../utils/Cache";
import { normalizeUserBookings } from "../../../constants/normalizer";

export default () => {
  const userFromStorage = getFromLocal("userInformation");
  const [successMsg, setSuccessMsg] = useState(false);
  const [loader, setLoader] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  const getBookedSlots = () => {
    setLoader(true);
    FirebaseDb.database()
      .ref("slots/")
      .once("value", (values) => {
        let slots = [];
        const filterValues = Object.values(values.val());
        for (var i = 0; i < filterValues.length; i++) {
          if (_.has(filterValues[i], "booking"))
            slots = slots.concat(Object.values(filterValues[i].booking));
        }
        const getUserSlots = slots.filter((e) => e.uid === userFromStorage.uid);
        setBookedSlots(getUserSlots);
        setLoader(false);
      });
  };

  useEffect(() => {
    getBookedSlots();
  }, []);

  const deleteBooking = (slotName, bookingID) => {
    setLoader(true);
    const slot = slotName.replace(" ", "");
    const ref = FirebaseDb.database().ref(`slots/${slot}/booking`);
    const query = ref.orderByChild(`bookingID`).equalTo(bookingID);
    query.once("value", (snapshot) => {
      const bookingKey = Object.keys(snapshot.val());
      FirebaseDb.database()
        .ref(`slots/${slot}/booking/${bookingKey[0]}`)
        .remove()
        .then((res) => {
          setLoader(false);
          setSuccessMsg(true);
          getBookedSlots();
        })
        .catch((err) => console.log(err));
    });
  };

  return (
    <>
      <div className="heading-with-item">
        <h2>My Bookings</h2>
      </div>
      <Table
        dataSource={bookedSlots}
        columns={normalizeUserBookings(deleteBooking)}
        loading={loader}
      />
      {successMsg && (
        <AlertBox
          title="Booking Cancelled"
          description="Booking Successfully Cancelled."
          onConfirm={() => setSuccessMsg(false)}
          type="success"
        />
      )}
    </>
  );
};
